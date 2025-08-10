from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet, PurchaseOrderViewSet, RouteVisitViewSet, RouteViewSet, SalesOrderViewSet

router = DefaultRouter()
router.register(r"sales-orders", SalesOrderViewSet)
router.register(r"purchase-orders", PurchaseOrderViewSet)
router.register(r"invoices", InvoiceViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"routes", RouteViewSet)
router.register(r"routevisits", RouteVisitViewSet)

urlpatterns = [path("", include(router.urls))]