from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerDetailView,
    CustomerInvoicesView,
    CustomerSalesOrdersView,
    CustomerSummaryView,
    InvoiceViewSet,
    OutstandingPaymentsView,
    PaymentViewSet,
    PurchaseOrderViewSet,
    RouteEfficiencyReportView,
    RouteVisitViewSet,
    RouteViewSet,
    SalesOrderViewSet,
    SalesVsPurchaseReportView,
    RouteLocationPingViewSet,
    VATReportView,
)

router = DefaultRouter()
router.register(r"sales-orders", SalesOrderViewSet)
router.register(r"purchase-orders", PurchaseOrderViewSet)
router.register(r"invoices", InvoiceViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"routes", RouteViewSet)
router.register(r"routevisits", RouteVisitViewSet)
router.register(r"route-location-pings", RouteLocationPingViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("reports/sales-vs-purchase/", SalesVsPurchaseReportView.as_view()),
    path("reports/route-efficiency/", RouteEfficiencyReportView.as_view()),
    path("reports/outstanding-payments/", OutstandingPaymentsView.as_view()),
    path("vat-report/", VATReportView.as_view()),
   
    path('customers/<uuid:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<customer_id>/orders/', CustomerSalesOrdersView.as_view(), name='customer-orders'),
    path('customers/<customer_id>/invoices/', CustomerInvoicesView.as_view(), name='customer-invoices'),
    path('customers/<customer_id>/summary/', CustomerSummaryView.as_view(), name='customer-summary'),
        
]
