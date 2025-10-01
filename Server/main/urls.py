from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProductViewSet, SupplierViewSet, VATSettingsViewSet, CustomerAvailableForSales, TestEndpoint, CreditReport
from django.urls import path, include

router = DefaultRouter()
router.register(r"customers", CustomerViewSet)
router.register(r"suppliers", SupplierViewSet)
router.register(r"products", ProductViewSet)
router.register(r"vat-settings", VATSettingsViewSet)
# router.register(r"customers/available_for_sales", CustomerAvailableForSalesViewSet)/

urlpatterns = [
               path("test/", TestEndpoint.as_view(), name="test-endpoint"),
               path("customers/available_for_sales/", CustomerAvailableForSales.as_view(), name="customer-available-for-sales"),
               path("customers/available_for_sales", CustomerAvailableForSales.as_view(), name="customer-available-for-sales-no-slash"),
               path("credit-report/", CreditReport.as_view(), name="credit-report"),
               path("", include(router.urls)),
               ]