from django.urls import include, path
from rest_framework.routers import DefaultRouter
from Server.transactions.views import (
    OutstandingPaymentsView,
    RouteEfficiencyReportView,
    SalesVsPurchaseReportView,
)
from audit.views import AuditLogViewSet

router = DefaultRouter()
router.register(r"logs", AuditLogViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("reports/sales-vs-purchase/", SalesVsPurchaseReportView.as_view()),
    path("reports/route-efficiency/", RouteEfficiencyReportView.as_view()),
    path("reports/outstanding-payments/", OutstandingPaymentsView.as_view()),
]
