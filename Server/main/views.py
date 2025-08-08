from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Customer, Product, Supplier, VATSettings
from .serializers import CustomerSerializer, ProductSerializer, SupplierSerializer, VATSettingsSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset         = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    
class SupplierViewSet(viewsets.ModelViewSet):
    queryset         = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    

class ProductViewSet(viewsets.ModelViewSet):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    

class VATSettingsViewSet(viewsets.ModelViewSet):
    queryset = VATSettings.objects.all()
    serializer_class = VATSettingsSerializer
    permission_classes = [IsAuthenticated]   
    


