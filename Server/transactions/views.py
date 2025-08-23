from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from .models import SalesOrder, PurchaseOrder
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Sales Order Report API
class SalesOrderReportView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start = request.GET.get('start')
        end = request.GET.get('end')
        qs = SalesOrder.objects.all()
        if start and end:
            qs = qs.filter(order_date__gte=start, order_date__lte=end)
        data = qs.aggregate(
            total_sales=Sum('grand_total'),
            total_profit=Sum('profit'),
            order_count=Count('id')
        )
        return Response(data)

# Purchase Order Report API
class PurchaseOrderReportView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start = request.GET.get('start')
        end = request.GET.get('end')
        qs = PurchaseOrder.objects.all()
        if start and end:
            qs = qs.filter(order_date__gte=start, order_date__lte=end)
        data = qs.aggregate(
            total_purchases=Sum('grand_total'),
            order_count=Count('id')
        )
        return Response(data)
from collections import defaultdict
from decimal import Decimal
from django.db.models import DecimalField
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import status
from django.db.models import Sum, Count, Avg, F, Case, When
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import action
from rest_framework.response import Response

from main.models import Customer
from .models import Invoice, OrderLineItem, Payment, PurchaseOrder, Route, RouteVisit, SalesOrder, RouteLocationPing
from .serializers import (
    InvoiceSerializer, PaymentSerializer, PurchaseOrderSerializer,
    RouteSerializer, RouteVisitSerializer, SalesOrderSerializer,
    RouteLocationPingSerializer, CustomerSerializer
)

class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            # Filter by route visits where user is the salesperson
            return qs.filter(route_visits__route__salesperson=user).distinct()
        return qs

    def get_serializer(self, *args, **kwargs):
        # Ensure the request context is passed to the serializer
        kwargs['context'] = self.get_serializer_context()
        return self.serializer_class(*args, **kwargs)

    @action(detail=True, methods=["get"])
    def profit(self, request, pk=None):
        """Return computed profit for this order."""
        order = self.get_object()
        return Response({"profit": str(order.profit)})

    @action(detail=False, methods=["post"])
    def create_from_route(self, request):
        """Create a sales order in the context of a route visit"""
        user = request.user
        route_id = request.data.get('route_id')
        customer_id = request.data.get('customer_id')
        
        if not route_id or not customer_id:
            return Response(
                {'detail': 'route_id and customer_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user is the salesperson for this route
        try:
            route = Route.objects.get(id=route_id, salesperson=user)
        except Route.DoesNotExist:
            return Response(
                {'detail': 'Route not found or access denied'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create route visit for this customer
        route_visit, created = RouteVisit.objects.get_or_create(
            route=route,
            customer_id=customer_id,
            defaults={'status': 'visited'}
        )
        
        # Create sales order
        order_data = request.data.copy()
        order_data['customer'] = customer_id
        order_data['order_date'] = order_data.get('order_date', timezone.now().date())
        
        serializer = self.get_serializer(data=order_data)
        if serializer.is_valid():
            order = serializer.save()
            
            # Link order to route visit
            route_visit.sales_orders.add(order)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        return [IsAuthenticated()]

    def has_write_access(self):
        role = getattr(self.request.user, 'role', )
        return role in ('admin', 'accountant', 'salesperson')

    def create(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().destroy(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        # Ensure the request context is passed to the serializer
        kwargs['context'] = self.get_serializer_context()
        return self.serializer_class(*args, **kwargs)
    
    
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            # Filter by route visits where user is the salesperson
            return qs.filter(sales_order__route_visits__route__salesperson=user).distinct()
        return qs

    def has_write_access(self):
        role = getattr(self.request.user, 'role', '')
        return role in ('admin', 'accountant')

    def create(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def refresh_outstanding(self, request, pk=None):
        """Manually refresh the outstanding amount for an invoice"""
        try:
            invoice = self.get_object()
            invoice.update_payment_status()
            
            return Response({
                'message': 'Invoice outstanding amount refreshed',
                'invoice_no': invoice.invoice_no,
                'paid_amount': str(invoice.paid_amount),
                'outstanding': str(invoice.outstanding),
                'status': invoice.status
            })
        except Exception as e:
            return Response({'detail': f'Error refreshing invoice: {str(e)}'}, status=500)

    @action(detail=False, methods=['post'])
    def refresh_all_outstanding(self, request):
        """Refresh outstanding amounts for all invoices"""
        try:
            invoices = self.get_queryset()
            updated_count = 0
            
            for invoice in invoices:
                invoice.update_payment_status()
                updated_count += 1
            
            return Response({
                'message': f'Refreshed outstanding amounts for {updated_count} invoices',
                'updated_count': updated_count
            })
        except Exception as e:
            return Response({'detail': f'Error refreshing invoices: {str(e)}'}, status=500)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            return qs.filter(invoice__sales_order__route_visits__route__salesperson=user)
        return qs

    def has_write_access(self):
        role = getattr(self.request.user, 'role', '')
        return role in ('admin', 'accountant','salesperson')

    def create(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        
        try:
            response = super().create(request, *args, **kwargs)
            
            # Refresh the invoice data to get updated outstanding amount
            payment = Payment.objects.get(id=response.data['id'])
            invoice = payment.invoice
            invoice.refresh_from_db()
            
            # Add updated invoice info to response
            response.data['invoice_updated'] = {
                'paid_amount': str(invoice.paid_amount),
                'outstanding': str(invoice.outstanding),
                'status': invoice.status
            }
            
            return response
        except Exception as e:
            return Response({'detail': f'Error creating payment: {str(e)}'}, status=500)

    def update(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().destroy(request, *args, **kwargs)
    

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            return qs.filter(salesperson=user)
        return qs

    @action(detail=True, methods=["get"])
    def visits(self, request, pk=None):
        route = self.get_object()
        visits = route.visits.all()
        serializer = RouteVisitSerializer(visits, many=True)
        return Response(serializer.data)


class RouteVisitViewSet(viewsets.ModelViewSet):
    queryset = RouteVisit.objects.all()
    serializer_class = RouteVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # Filter by salesperson role
        if role == 'salesperson':
            qs = qs.filter(route__salesperson=user)
        
        # Apply additional filters from query parameters
        route_id = self.request.query_params.get('route')
        customer_id = self.request.query_params.get('customer')
        status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if route_id:
            qs = qs.filter(route_id=route_id)
        
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        
        if status:
            qs = qs.filter(status=status)
        
        if date_from:
            qs = qs.filter(route__date__gte=date_from)
        
        if date_to:
            qs = qs.filter(route__date__lte=date_to)
        
        return qs.select_related('route', 'customer').prefetch_related('sales_orders')

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in to a route visit"""
        route_visit = self.get_object()
        
        # Validate that the current user is the salesperson for this route
        if hasattr(request.user, 'role') and request.user.role == 'salesperson':
            if route_visit.route.salesperson != request.user:
                return Response(
                    {'detail': 'You can only check in to your own route visits'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get location data from request
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        
        # Update check-in information
        route_visit.check_in = timezone.now()
        route_visit.status = 'visited'
        
        if lat and lon:
            route_visit.lat = lat
            route_visit.lon = lon
        
        route_visit.save()
        
        serializer = self.get_serializer(route_visit)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check out from a route visit"""
        route_visit = self.get_object()
        
        # Validate that the current user is the salesperson for this route
        if hasattr(request.user, 'role') and request.user.role == 'salesperson':
            if route_visit.route.salesperson != request.user:
                return Response(
                    {'detail': 'You can only check out from your own route visits'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Update check-out information
        route_visit.check_out = timezone.now()
        
        # Calculate visit duration if check-in exists
        if route_visit.check_in and route_visit.check_out:
            duration = route_visit.check_out - route_visit.check_in
            route_visit.visit_duration_minutes = int(duration.total_seconds() / 60)
        
        # Add notes if provided
        notes = request.data.get('notes')
        if notes:
            if route_visit.notes:
                route_visit.notes += f"\n\n{notes}"
            else:
                route_visit.notes = notes
        
        # Handle payment information
        payment_collected = request.data.get('payment_collected', False)
        if payment_collected:
            route_visit.payment_collected = True
            payment_amount = request.data.get('payment_amount')
            if payment_amount:
                route_visit.payment_amount = payment_amount
        
        # Handle issues reported
        issues_reported = request.data.get('issues_reported')
        if issues_reported:
            route_visit.issues_reported = issues_reported
        
        route_visit.save()
        
        serializer = self.get_serializer(route_visit)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_sales_order(self, request, pk=None):
        """Add a sales order to a route visit"""
        route_visit = self.get_object()
        sales_order_id = request.data.get('sales_order_id')
        
        if not sales_order_id:
            return Response(
                {'detail': 'sales_order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sales_order = SalesOrder.objects.get(id=sales_order_id)
            
            # Validate that the sales order belongs to the same customer
            if sales_order.customer != route_visit.customer:
                return Response(
                    {'detail': 'Sales order must belong to the same customer as the route visit'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            route_visit.sales_orders.add(sales_order)
            
            serializer = self.get_serializer(route_visit)
            return Response(serializer.data)
            
        except SalesOrder.DoesNotExist:
            return Response(
                {'detail': 'Sales order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['delete'])
    def remove_sales_order(self, request, pk=None):
        """Remove a sales order from a route visit"""
        route_visit = self.get_object()
        sales_order_id = request.query_params.get('sales_order_id')
        
        if not sales_order_id:
            return Response(
                {'detail': 'sales_order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sales_order = SalesOrder.objects.get(id=sales_order_id)
            route_visit.sales_orders.remove(sales_order)
            
            serializer = self.get_serializer(route_visit)
            return Response(serializer.data)
            
        except SalesOrder.DoesNotExist:
            return Response(
                {'detail': 'Sales order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """Get route visits within a date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'detail': 'start_date and end_date are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            queryset = self.get_queryset().filter(
                route__date__gte=start,
                route__date__lte=end
            )
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except ValueError:
            return Response(
                {'detail': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    

class RouteLocationPingViewSet(viewsets.ModelViewSet):
    queryset = RouteLocationPing.objects.all()
    serializer_class = RouteLocationPingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        # Salespeople can only view their own route pings
        if role == 'salesperson':
            qs = qs.filter(route__salesperson=user)
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Enhanced create with GPS validation and WebSocket broadcasting"""
        try:
            # Enhanced GPS validation
            lat = float(request.data.get('lat', 0))
            lon = float(request.data.get('lon', 0))
            accuracy = float(request.data.get('accuracy_meters', 0)) if request.data.get('accuracy_meters') else None
            
            # Basic coordinate validation
            if lat < -90 or lat > 90 or lon < -180 or lon > 180:
                return Response({'detail': 'Invalid GPS coordinates'}, status=400)
            
            # Accuracy validation
            if accuracy and accuracy > 100:  # Reject readings worse than 100m
                return Response({
                    'detail': f'GPS accuracy too poor: {accuracy:.1f}m'
                }, status=400)
            
            # Check for unrealistic speed
            speed_mps = float(request.data.get('speed_mps', 0)) if request.data.get('speed_mps') else None
            if speed_mps and speed_mps * 3.6 > 120:  # > 120 km/h is unrealistic for delivery routes
                return Response({
                    'detail': f'Unrealistic speed detected: {speed_mps * 3.6:.1f} km/h'
                }, status=400)
            
            # Check minimum movement requirement
            route_id = request.data.get('route')
            if route_id:
                last_ping = RouteLocationPing.objects.filter(
                    route_id=route_id
                ).order_by('-created_at').first()
                
                if last_ping:
                    # Calculate distance from last ping
                    distance = self._calculate_distance(
                        float(last_ping.lat), float(last_ping.lon),
                        lat, lon
                    )
                    
                    # Check minimum distance (50m) and time interval (30 seconds)
                    time_since_last = (timezone.now() - last_ping.created_at).total_seconds()
                    
                    if distance < 50 and time_since_last < 30:
                        return Response({
                            'detail': f'Insufficient movement: {distance:.1f}m in {time_since_last:.1f}s'
                        }, status=400)
            
            # Create the ping
            response = super().create(request, *args, **kwargs)
            
            # Broadcast via WebSocket (handled by signal)
            # The post_save signal will automatically broadcast this
            
            print(f"GPS ping created successfully: {response.data.get('id')}")
            return response
            
        except ValueError as e:
            return Response({'detail': f'Invalid numeric data: {str(e)}'}, status=400)
        except Exception as e:
            print(f"Error creating RouteLocationPing: {e}")
            return Response({'detail': f'Error creating GPS ping: {str(e)}'}, status=500)

    @action(detail=False, methods=['post'])
    def start_route_tracking(self, request):
        """Enhanced start tracking with WebSocket notification"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Check permissions
            if hasattr(user, 'role') and user.role == 'salesperson' and route.salesperson != user:
                return Response({'detail': 'You can only track your own routes'}, status=403)
            
            # Check if already tracking
            recent_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__gte=timezone.now() - timezone.timedelta(minutes=30)
            ).order_by('-created_at')
            
            # Broadcast tracking status
            channel_layer = get_channel_layer()
            if channel_layer:
                route_group_name = f'route_{route.id}'
                async_to_sync(channel_layer.group_send)(
                    route_group_name,
                    {
                        'type': 'tracking_status_update',
                        'status': 'started',
                        'message': 'GPS tracking started'
                    }
                )
            
            if recent_pings.exists():
                return Response({
                    'message': 'Route tracking already active',
                    'route_id': str(route.id),
                    'status': 'active'
                })
            
            return Response({
                'message': 'Route tracking started',
                'route_id': str(route.id),
                'status': 'started'
            })
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    @action(detail=False, methods=['post'])
    def stop_route_tracking(self, request):
        """Enhanced stop tracking with WebSocket notification"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            
            # Broadcast tracking status
            channel_layer = get_channel_layer()
            if channel_layer:
                route_group_name = f'route_{route.id}'
                async_to_sync(channel_layer.group_send)(
                    route_group_name,
                    {
                        'type': 'tracking_status_update',
                        'status': 'stopped',
                        'message': 'GPS tracking stopped'
                    }
                )
            
            return Response({
                'message': 'Route tracking stopped',
                'route_id': str(route.id)
            })
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)
        
        
        
class VATReportView(APIView):
    """
    GET /api/transactions/vat-report/?start=YYYY-MM-DD&end=YYYY-MM-DD
    Returns FTA-compliant VAT summary.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        # Parse and validate date parameters
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        
        if not (start and end):
            return Response(
                {"detail": "start & end query parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle VAT-inclusive vs exclusive pricing logic
        line_items = (
            OrderLineItem.objects
            .select_related('product__vat_category', 'sales_order')
            .filter(
                sales_order__invoice__issue_date__gte=start,
                sales_order__invoice__issue_date__lte=end
            )
            .annotate(
                vat_rate=F('product__vat_category__rate'),
                vat_category=F('product__vat_category__category'),
                prices_include_vat=F('sales_order__prices_include_vat'),
                # Calculate net amount and VAT based on pricing model
                net_amount=Case(
                    # When prices include VAT: net = gross / (1 + rate/100)
                    When(
                        sales_order__prices_include_vat=True,
                        product__vat_category__rate__gt=0,
                        then=F('line_total') / (1 + F('product__vat_category__rate') / 100)
                    ),
                    # When prices exclude VAT or rate is 0: net = gross
                    default=F('line_total'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                ),
                vat_amount=Case(
                    # When prices include VAT: vat = gross - net
                    When(
                        sales_order__prices_include_vat=True,
                        product__vat_category__rate__gt=0,
                        then=F('line_total') - (F('line_total') / (1 + F('product__vat_category__rate') / 100))
                    ),
                    # When prices exclude VAT: vat = net * rate/100
                    When(
                        product__vat_category__rate__isnull=False,
                        then=F('line_total') * F('product__vat_category__rate') / 100
                    ),
                    default=Decimal('0.00'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                )
            )
            .values('vat_category', 'net_amount', 'vat_amount')
        )
        
        # Initialize report structure
        report = {
            "period_start": str(start),
            "period_end": str(end),
        }
        
        # Use defaultdict for cleaner aggregation
        category_totals = defaultdict(lambda: {"sales": Decimal('0.00'), "vat": Decimal('0.00')})
        
        # Aggregate data efficiently
        for item in line_items:
            category = item['vat_category'] or 'uncategorized'
            category_totals[category]["sales"] += Decimal(str(item['net_amount'] or 0))
            category_totals[category]["vat"] += Decimal(str(item['vat_amount'] or 0))
        
        # Convert to the expected format and ensure float conversion for JSON serialization
        for category, totals in category_totals.items():
            report[category] = {
                "sales": float(totals["sales"]),
                "vat": float(totals["vat"])
            }
        
        return Response(report, status=status.HTTP_200_OK)

class SalesVsPurchaseReportView(APIView):
    """Sales vs Purchase comparison report"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        
        if not (start and end):
            return Response({"detail": "start & end required"}, status=400)
        
        # Sales data
        sales_data = SalesOrder.objects.filter(
            order_date__gte=start, order_date__lte=end
        ).aggregate(
            total_sales=Sum('grand_total'),
            total_profit=Sum('profit'),
            order_count=Count('id')
        )
        
        # Purchase data  
        purchase_data = PurchaseOrder.objects.filter(
            order_date__gte=start, order_date__lte=end
        ).aggregate(
            total_purchases=Sum('grand_total'),
            order_count=Count('id')
        )
        print({
            "period": {"start": start, "end": end},
            "sales": sales_data,
            "purchases": purchase_data,
            "net_profit": (sales_data.get('total_sales', 0) or 0) - (purchase_data.get('total_purchases', 0) or 0)
        })
        return Response({
            "period": {"start": start, "end": end},
            "sales": sales_data,
            "purchases": purchase_data,
            "net_profit": (sales_data.get('total_sales', 0) or 0) - (purchase_data.get('total_purchases', 0) or 0)
        })

class RouteEfficiencyReportView(APIView):
    """Route efficiency and performance reports"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        
        routes = Route.objects.filter(date__gte=start, date__lte=end)
        
        report_data = []
        for route in routes:
            visits = route.visits.all()
            total_visits = visits.count()
            completed_visits = visits.filter(status='visited').count()
            
            report_data.append({
                "route_id": route.id,
                "route_name": route.name,
                "salesperson": route.salesperson.email,
                "date": route.date,
                "total_planned": total_visits,
                "completed": completed_visits,
                "completion_rate": (completed_visits / total_visits * 100) if total_visits > 0 else 0,
                "missed": visits.filter(status='missed').count()
            })
        
        return Response(report_data)

class OutstandingPaymentsView(APIView):
    """Outstanding payments by customer"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all invoices that have outstanding amounts
        invoices = Invoice.objects.select_related('sales_order__customer').all()
        
        customer_outstanding = {}
        for invoice in invoices:
            outstanding = invoice.outstanding
            if outstanding > 0:  # Only include invoices with outstanding amounts
                customer = invoice.sales_order.customer
                if customer.id not in customer_outstanding:
                    customer_outstanding[customer.id] = {
                        "customer_name": customer.name,
                        "customer_email": customer.email,
                        "total_outstanding": 0,
                        "invoice_count": 0
                    }
                
                customer_outstanding[customer.id]["total_outstanding"] += float(outstanding)
                customer_outstanding[customer.id]["invoice_count"] += 1
        
        # Format the amounts properly
        result = []
        for customer_data in customer_outstanding.values():
            customer_data["total_outstanding"] = round(customer_data["total_outstanding"], 2)
            result.append(customer_data)
        
        return Response(result)
    
class CustomerViewSet(viewsets.ModelViewSet):
    """Customer ViewSet with proper CRUD operations"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # If salesperson, only show customers they've interacted with
        if role == 'salesperson':
            qs = qs.filter(sales_orders__salesperson=user).distinct()
        
        return qs

# Update the existing CustomerDetailView
class CustomerDetailView(generics.RetrieveAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# Update CustomerSalesOrdersView
class CustomerSalesOrdersView(generics.ListAPIView):
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs['customer_id']
        qs = SalesOrder.objects.filter(customer_id=customer_id)
        
        # Apply role-based filtering
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            qs = qs.filter(salesperson=user)
            
        return qs.select_related('customer').prefetch_related('line_items__product')

# Update CustomerInvoicesView
class CustomerInvoicesView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs['customer_id']
        qs = Invoice.objects.filter(sales_order__customer_id=customer_id)
        
        # Apply role-based filtering
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            qs = qs.filter(sales_order__salesperson=user)
            
        return qs.select_related('sales_order__customer').prefetch_related('payments')

# Add a comprehensive customer summary view
class CustomerSummaryView(APIView):
    """Get comprehensive customer data in one call"""
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
            
            # Get sales orders
            sales_orders = SalesOrder.objects.filter(customer=customer)
            
            # Get invoices
            invoices = Invoice.objects.filter(sales_order__customer=customer)
            
            # Apply role-based filtering
            user = request.user
            role = getattr(user, 'role', '')
            if role == 'salesperson':
                sales_orders = sales_orders.filter(salesperson=user)
                invoices = invoices.filter(sales_order__salesperson=user)
            
            # Serialize data
            customer_data = CustomerSerializer(customer).data
            orders_data = SalesOrderSerializer(sales_orders, many=True).data
            invoices_data = InvoiceSerializer(invoices, many=True).data
            
            # Calculate summary statistics
            total_orders = sales_orders.count()
            pending_orders = sales_orders.filter(status='confirmed').count()
            total_spent = sales_orders.aggregate(total=Sum('grand_total'))['total'] or 0
            outstanding_balance = sum(float(inv.outstanding) for inv in invoices)
            
            return Response({
                'customer': customer_data,
                'orders': orders_data,
                'invoices': invoices_data,
                'summary': {
                    'total_orders': total_orders,
                    'pending_orders': pending_orders,
                    'total_spent': float(total_spent),
                    'outstanding_balance': outstanding_balance,
                    'paid_invoices': invoices.filter(status='paid').count(),
                    'overdue_invoices': invoices.filter(status='overdue').count()
                }
            })
            
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


