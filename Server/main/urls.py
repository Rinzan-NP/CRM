from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProductViewSet, SupplierViewSet, VATSettingsViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r"customers", CustomerViewSet)
router.register(r"suppliers", SupplierViewSet)
router.register(r"products", ProductViewSet)
router.register(r"vat-settings", VATSettingsViewSet)

urlpatterns = [path("", include(router.urls))]