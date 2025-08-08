from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Product, Supplier
from .serializers import ProductSerializer, SupplierSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset         = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    

class ProductViewSet(viewsets.ModelViewSet):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]