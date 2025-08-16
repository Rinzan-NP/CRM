from rest_framework import serializers
from .models import Customer, Product, Supplier, VATSettings

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
    has_coordinates = serializers.ReadOnlyField()
    location_display = serializers.ReadOnlyField()
    distance_km = serializers.ReadOnlyField(required=False)  # For nearby searches
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'credit_limit', 'address',
            'lat', 'lon', 'city', 'state', 'country', 'postal_code',
            'location_verified', 'has_coordinates', 'location_display',
            'distance_km', 'current_balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_lat(self, value):
        """Validate latitude"""
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_lon(self, value):
        """Validate longitude"""
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value
    
    def validate(self, data):
        """Validate that if coordinates are provided, they are both present and valid"""
        lat = data.get('lat')
        lon = data.get('lon')
        
        # Check if coordinates are provided together
        if (lat is not None and lon is None) or (lat is None and lon is not None):
            raise serializers.ValidationError(
                "Both latitude and longitude must be provided together"
            )
        
        # Validate coordinate types and ranges
        if lat is not None and lon is not None:
            try:
                lat_float = float(lat)
                lon_float = float(lon)
                
                if lat_float < -90 or lat_float > 90:
                    raise serializers.ValidationError(
                        "Latitude must be between -90 and 90 degrees"
                    )
                
                if lon_float < -180 or lon_float > 180:
                    raise serializers.ValidationError(
                        "Longitude must be between -180 and 180 degrees"
                    )
                    
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    "Coordinates must be valid numbers"
                )
        
        return data
        

class VATSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VATSettings
        fields = ['id', 'category', 'rate']
        read_only_fields = ['id']