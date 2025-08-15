from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import status
from django.db.models import Sum, Count, Avg
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import action
from rest_framework.response import Response

from main.models import Customer
from .models import Invoice, Payment, PurchaseOrder, Route, RouteVisit, SalesOrder, RouteLocationPing
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
            return qs.filter(salesperson=user)
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
            return qs.filter(sales_order__salesperson=user)
        return qs

    def has_write_access(self):
        role = getattr(self.request.user, 'role', '')
        return role in ('admin', 'accountant','salesperson')

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

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            return qs.filter(invoice__sales_order__salesperson=user)
        return qs

    def has_write_access(self):
        role = getattr(self.request.user, 'role', '')
        return role in ('admin', 'accountant','salesperson')

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
        
        # Add notes if provided
        notes = request.data.get('notes')
        if notes:
            if route_visit.notes:
                route_visit.notes += f"\n\n{notes}"
            else:
                route_visit.notes = notes
        
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
        """Override create to add debugging"""
        try:
            print(f"Creating RouteLocationPing with data: {request.data}")
            print(f"User: {request.user}, Role: {getattr(request.user, 'role', 'N/A')}")
            
            # Check if route exists and user has permission
            route_id = request.data.get('route')
            if route_id:
                try:
                    route = Route.objects.get(id=route_id)
                    print(f"Route found: {route.name}, Salesperson: {route.salesperson}")
                    
                    # Check permissions
                    user = request.user
                    role = getattr(user, 'role', '')
                    if role == 'salesperson' and route.salesperson != user:
                        print(f"Permission denied: {user} cannot access route {route_id}")
                        return Response(
                            {'detail': 'You can only send location for your own routes'}, 
                            status=403
                        )
                except Route.DoesNotExist:
                    print(f"Route not found: {route_id}")
                    return Response({'detail': 'Route not found'}, status=404)
            
            return super().create(request, *args, **kwargs)
            
        except Exception as e:
            print(f"Error creating RouteLocationPing: {e}")
            print(f"Request data: {request.data}")
            raise

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', '')
        route = serializer.validated_data.get('route')
        # Salespeople can only create pings for their own routes
        if role == 'salesperson' and route and route.salesperson != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only send location for your own routes')
        serializer.save()

    @action(detail=False, methods=['post'])
    def start_route_tracking(self, request):
        """Start tracking a route"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Check permissions
            if user.role == 'salesperson' and route.salesperson != user:
                return Response({'detail': 'You can only track your own routes'}, status=403)
            
            # Check if tracking is already active (within last 30 minutes)
            active_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__date=timezone.now().date()
            ).order_by('-created_at')
            
            if active_pings.exists():
                last_ping = active_pings.first()
                # If last ping was within 30 minutes, consider tracking active
                if timezone.now() - last_ping.created_at < timezone.timedelta(minutes=30):
                    return Response({
                        'message': 'Route tracking already active - continuing existing session',
                        'route_id': str(route.id),
                        'route_name': route.name,
                        'tracking_id': str(last_ping.id),
                        'last_ping': last_ping.created_at,
                        'status': 'active'
                    }, status=200)  # Changed from 400 to 200
            
            return Response({
                'message': 'Route tracking started',
                'route_id': str(route.id),
                'route_name': route.name,
                'start_time': timezone.now(),
                'status': 'started'
            })
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    @action(detail=False, methods=['post'])
    def stop_route_tracking(self, request):
        """Stop tracking a route and calculate summary"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Check permissions
            if user.role == 'salesperson' and route.salesperson != user:
                return Response({'detail': 'You can only track your own routes'}, status=403)
            
            # Get all pings for today
            today_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__date=timezone.now().date()
            ).order_by('created_at')
            
            if not today_pings.exists():
                return Response({'detail': 'No tracking data found for today'}, status=400)
            
            # Calculate route summary
            summary = self._calculate_route_summary(today_pings)
            
            return Response({
                'message': 'Route tracking stopped',
                'route_id': str(route.id),
                'route_name': route.name,
                'summary': summary
            })
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    @action(detail=False, methods=['get'])
    def route_summary(self, request):
        """Get route summary and optimization metrics"""
        route_id = request.query_params.get('route_id')
        if not route_id:
            return Response({'error': 'route_id is required'}, status=400)
        
        try:
            # Get all pings for the route
            pings = self.get_queryset().filter(route_id=route_id).order_by('created_at')
            
            if not pings.exists():
                return Response({'error': 'No location data found for this route'}, status=404)
            
            # Calculate route summary
            total_distance = 0
            total_time = 0
            speeds = []
            
            for i in range(1, len(pings)):
                prev_ping = pings[i-1]
                curr_ping = pings[i]
                
                # Calculate distance between consecutive pings
                distance = self._calculate_distance(
                    prev_ping.lat, prev_ping.lon,
                    curr_ping.lat, curr_ping.lon
                )
                total_distance += distance
                
                # Calculate time difference
                time_diff = (curr_ping.created_at - prev_ping.created_at).total_seconds() / 3600  # hours
                total_time += time_diff
                
                # Calculate speed if available
                if curr_ping.speed_mps:
                    speeds.append(float(curr_ping.speed_mps) * 3.6)  # Convert to km/h
            
            # Calculate average speed
            average_speed = sum(speeds) / len(speeds) if speeds else 0
            
            # Get route details for optimization
            try:
                route = Route.objects.get(id=route_id)
                route_visits = route.visits.all()
                
                # Calculate optimal distance (straight line between planned visits)
                optimal_distance = 0
                if route_visits.count() > 1:
                    visits_with_coords = [v for v in route_visits if v.lat and v.lon]
                    for i in range(1, len(visits_with_coords)):
                        optimal_distance += self._calculate_distance(
                            visits_with_coords[i-1].lat, visits_with_coords[i-1].lon,
                            visits_with_coords[i].lat, visits_with_coords[i].lon
                        )
                
                # Calculate efficiency metrics
                deviation = max(0, total_distance - optimal_distance) if optimal_distance > 0 else 0
                efficiency_percentage = max(0, min(100, (optimal_distance / total_distance * 100) if total_distance > 0 else 100))
                
                # Estimate fuel consumption (assuming 8L/100km average)
                fuel_consumption = (total_distance / 100) * 8
                fuel_cost = fuel_consumption * 1.5  # Assuming $1.5/L
                
                # Determine time efficiency
                if efficiency_percentage > 80:
                    time_efficiency = 'High'
                elif efficiency_percentage > 60:
                    time_efficiency = 'Medium'
                else:
                    time_efficiency = 'Low'
                
                optimization_data = {
                    'efficiency_percentage': round(efficiency_percentage, 1),
                    'actual_distance_km': round(total_distance, 2),
                    'optimal_distance_km': round(optimal_distance, 2),
                    'deviation_km': round(deviation, 2),
                    'fuel_consumption_liters': round(fuel_consumption, 1),
                    'estimated_fuel_cost': round(fuel_cost, 2),
                    'time_efficiency': time_efficiency
                }
                
            except Route.DoesNotExist:
                optimization_data = None
            
            summary = {
                'total_distance_km': round(total_distance, 2),
                'total_time_hours': round(total_time, 2),
                'average_speed_kmh': round(average_speed, 1),
                'ping_count': pings.count(),
                'start_time': pings.first().created_at.isoformat(),
                'end_time': pings.last().created_at.isoformat()
            }
            
            return Response({
                'summary': summary,
                'optimization': optimization_data
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates using Haversine formula"""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r

    @action(detail=False, methods=['post'])
    def test_ping(self, request):
        """Test endpoint to verify ping creation works"""
        print(f"Test ping received: {request.data}")
        return Response({
            'message': 'Test ping received successfully',
            'data': request.data,
            'user': str(request.user),
            'role': getattr(request.user, 'role', 'N/A')
        })



class VATReportView(APIView):
    """
    GET /api/transactions/vat-report/?start=YYYY-MM-DD&end=YYYY-MM-DD
    Returns FTA-compliant VAT summary.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        if not (start and end):
            return Response(
                {"detail": "start & end query parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get invoices in the date range
        invoices = Invoice.objects.filter(
            issue_date__gte=start,
            issue_date__lte=end
        ).select_related('sales_order')

        report = {
            "period_start": str(start),
            "period_end": str(end),
            "standard_sales": 0.0,
            "standard_vat": 0.0,
            "zero_sales": 0.0,
            "zero_vat": 0.0,
            "exempt_sales": 0.0,
            "exempt_vat": 0.0,
        }

        for invoice in invoices:
            sales_order = invoice.sales_order
            # Calculate VAT by category for each line item
            for line_item in sales_order.line_items.select_related('product__vat_category'):
                category = line_item.product.vat_category.category.lower()
                line_total = float(line_item.line_total)
                vat_rate = line_item.product.vat_category.rate
                vat_amount = line_total * float(vat_rate) / 100

                if 'standard' in category:
                    report["standard_sales"] += line_total
                    report["standard_vat"] += vat_amount
                elif 'zero' in category:
                    report["zero_sales"] += line_total
                    report["zero_vat"] += vat_amount
                elif 'exempt' in category:
                    report["exempt_sales"] += line_total
                    report["exempt_vat"] += vat_amount

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


