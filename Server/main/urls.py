from django.urls import path

from .views import SupplierViewSet

urlpatterns = [
    path('suppliers/', SupplierViewSet.as_view({'get': 'list', 'post': 'create'}), name='supplier-list'),
]
