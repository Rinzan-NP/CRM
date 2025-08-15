from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Customer, Product, Supplier, VATSettings
from .serializers import CustomerSerializer, ProductSerializer, SupplierSerializer, VATSettingsSerializer
from .services import LocationService


class CustomerViewSet(viewsets.ModelViewSet):
    queryset         = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Override create method to add debug logging"""
        print(f"DEBUG: Creating customer with data: {request.data}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"DEBUG: Error creating customer: {str(e)}")
            raise

    @action(detail=True, methods=['post'])
    def geocode_address(self, request, pk=None):
        """Geocode customer address to get GPS coordinates"""
        customer = self.get_object()
        
        if not customer.address:
            return Response(
                {'detail': 'Customer has no address to geocode'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the location service to geocode
        result = LocationService.geocode_address(customer.address)
        
        if result:
            # Update customer with coordinates
            customer.lat = result['lat']
            customer.lon = result['lon']
            customer.location_verified = True
            
            # Extract additional address components if available
            address_details = result.get('address', {})
            if address_details:
                customer.city = address_details.get('city') or address_details.get('town')
                customer.state = address_details.get('state')
                customer.country = address_details.get('country_code', '').upper()
                customer.postal_code = address_details.get('postcode')
            
            customer.save()
            
            serializer = self.get_serializer(customer)
            return Response({
                'message': 'Address geocoded successfully',
                'customer': serializer.data,
                'coordinates': {'lat': result['lat'], 'lon': result['lon']}
            })
        else:
            return Response(
                {'detail': 'Failed to geocode address. Please check the address format.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def set_coordinates(self, request, pk=None):
        """Manually set customer GPS coordinates"""
        customer = self.get_object()
        
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        
        if not lat or not lon:
            return Response(
                {'detail': 'Both lat and lon are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lon = float(lon)
        except ValueError:
            return Response(
                {'detail': 'Invalid coordinates format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not LocationService.validate_coordinates(lat, lon):
            return Response(
                {'detail': 'Coordinates out of valid range'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update customer coordinates
        customer.lat = lat
        customer.lon = lon
        customer.location_verified = True
        customer.save()
        
        # Try to reverse geocode to get address details
        address_result = LocationService.reverse_geocode(lat, lon)
        if address_result:
            address_details = address_result.get('address', {})
            if address_details:
                customer.city = address_details.get('city') or address_details.get('town')
                customer.state = address_details.get('state')
                customer.country = address_details.get('country_code', '').upper()
                customer.postal_code = address_details.get('postcode')
                customer.save()
        
        serializer = self.get_serializer(customer)
        return Response({
            'message': 'Coordinates set successfully',
            'customer': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Find customers near a specific location"""
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius = request.query_params.get('radius', 10.0)  # Default 10km radius
        
        if not lat or not lon:
            return Response(
                {'detail': 'Both lat and lon query parameters are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lon = float(lon)
            radius = float(radius)
        except ValueError:
            return Response(
                {'detail': 'Invalid coordinate or radius format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not LocationService.validate_coordinates(lat, lon):
            return Response(
                {'detail': 'Coordinates out of valid range'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all customers with coordinates
        customers_with_coords = Customer.objects.filter(
            lat__isnull=False, 
            lon__isnull=False
        )
        
        # Find nearby customers
        nearby_customers = LocationService.find_nearby_customers(
            lat, lon, customers_with_coords, radius
        )
        
        serializer = self.get_serializer(nearby_customers, many=True)
        return Response({
            'center': {'lat': lat, 'lon': lon},
            'radius_km': radius,
            'customers': serializer.data,
            'count': len(nearby_customers)
        })
    
    @action(detail=False, methods=['get'])
    def with_coordinates(self, request):
        """Get all customers that have GPS coordinates"""
        customers = Customer.objects.filter(
            lat__isnull=False, 
            lon__isnull=False
        )
        
        serializer = self.get_serializer(customers, many=True)
        return Response({
            'customers': serializer.data,
            'count': customers.count()
        })
    

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
    


