from rest_framework import serializers
from main.models import Product
from .models import Customer, VATSettings   # same app


from rest_framework import serializers
from main.models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'credit_limit', 'current_balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
        
class ProductSerializer(serializers.ModelSerializer):
    vat_rate = serializers.ReadOnlyField(source='vat_category.rate')

    class Meta:
        model = Product
        fields = [
            'id', 'code', 'name', 'unit_price', 'unit_cost', 'vat_category', 'vat_rate',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vat_rate']
        

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'credit_limit', 'current_balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        

class VATSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VATSettings
        fields = ['id', 'category', 'rate']
        read_only_fields = ['id']