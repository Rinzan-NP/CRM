from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Sum
from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, Payment, PurchaseOrder, Route, RouteVisit, SalesOrder
from .serializers import InvoiceSerializer, PaymentSerializer, PurchaseOrderSerializer, RouteSerializer, RouteVisitSerializer, SalesOrderSerializer

class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

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

    def get_serializer(self, *args, **kwargs):
        # Ensure the request context is passed to the serializer
        kwargs['context'] = self.get_serializer_context()
        return self.serializer_class(*args, **kwargs)
    
    
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

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

        qs = Invoice.objects.filter(
            issue_date__gte=start,
            issue_date__lte=end
        ).select_related("sales_order__line_items__product__vat_category")

        raw = (
            qs.values("sales_order__line_items__product__vat_category__category")
            .annotate(total_sales=Sum("amount_due"))
            .annotate(total_vat=Sum("vat_total"))
        )

        report = {
            "period_start": str(start),
            "period_end":   str(end),
            "standard_sales": 0.0,
            "standard_vat":   0.0,
            "zero_sales":     0.0,
            "zero_vat":       0.0,
            "exempt_sales":   0.0,
            "exempt_vat":     0.0,
        }

        for row in raw:
            cat = row["sales_order__line_items__product__vat_category__category"]
            sales = float(row["total_sales"] or 0)
            vat = float(row["total_vat"] or 0)
            if cat == "Standard":
                report["standard_sales"] += sales
                report["standard_vat"] += vat
            elif cat == "Zero":
                report["zero_sales"] += sales
                report["zero_vat"] += vat
            elif cat == "Exempt":
                report["exempt_sales"] += sales
                report["exempt_vat"] += vat

        return Response(report,status=status.HTTP_200_OK)