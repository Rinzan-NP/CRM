from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Sum, Count, Avg
from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, Payment, PurchaseOrder, Route, RouteVisit, SalesOrder, RouteLocationPing
from .serializers import (
    InvoiceSerializer, PaymentSerializer, PurchaseOrderSerializer,
    RouteSerializer, RouteVisitSerializer, SalesOrderSerializer,
    RouteLocationPingSerializer
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
        if role == 'salesperson':
            return qs.filter(route__salesperson=user)
        return qs
    

class RouteLocationPingViewSet(viewsets.ModelViewSet):
    queryset = RouteLocationPing.objects.all()
    serializer_class = RouteLocationPingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        return qs.order_by('-created_at')



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
        # Get invoices with outstanding amounts
        outstanding_invoices = Invoice.objects.filter(
            status__in=['sent', 'overdue']
        ).select_related('sales_order__customer')
        
        customer_outstanding = {}
        for invoice in outstanding_invoices:
            customer = invoice.sales_order.customer
            if customer.id not in customer_outstanding:
                customer_outstanding[customer.id] = {
                    "customer_name": customer.name,
                    "customer_email": customer.email,
                    "total_outstanding": 0,
                    "invoice_count": 0
                }
            
            customer_outstanding[customer.id]["total_outstanding"] += invoice.outstanding
            customer_outstanding[customer.id]["invoice_count"] += 1
        
        return Response(list(customer_outstanding.values()))

# # Add to transactions/urls.py:
# """

# """