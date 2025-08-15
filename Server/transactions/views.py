from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import status
from django.db.models import Sum, Count, Avg
from django.utils.dateparse import parse_date
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
        
        from django.utils import timezone
        
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
        
        from django.utils import timezone
        
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
        print(f"Creating RouteLocationPing with data: {request.data}")
        print(f"User: {request.user}, Role: {getattr(request.user, 'role', 'N/A')}")
        print(f"Data types: route={type(request.data.get('route'))}, lat={type(request.data.get('lat'))}, lon={type(request.data.get('lon'))}")
        
        try:
            # Validate the data first
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"Serializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Error creating RouteLocationPing: {e}")
            import traceback
            traceback.print_exc()
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


