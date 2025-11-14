from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Credit, Customer, Product, Supplier, VATSettings
from transactions.models import Payment
from .serializers import (
    CreditSerializer,
    CustomerSerializer,
    ProductSerializer,
    SupplierSerializer,
    VATSettingsSerializer,
)
from .services import LocationService
from audit.signals import AuditContext


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    def create(self, request, *args, **kwargs):
        """Override create method to add debug logging"""
        print(f"DEBUG: Creating customer with data: {request.data}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"DEBUG: Error creating customer: {str(e)}")
            raise

    @action(detail=True, methods=["post"])
    def geocode_address(self, request, pk=None):
        """Geocode customer address to get GPS coordinates"""
        customer = self.get_object()

        if not customer.address:
            return Response(
                {"detail": "Customer has no address to geocode"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use the location service to geocode
        result = LocationService.geocode_address(customer.address)

        if result:
            # Update customer with coordinates
            customer.lat = result["lat"]
            customer.lon = result["lon"]
            customer.location_verified = True

            # Extract additional address components if available
            address_details = result.get("address", {})
            if address_details:
                customer.city = address_details.get("city") or address_details.get(
                    "town"
                )
                customer.state = address_details.get("state")
                customer.country = address_details.get("country_code", "").upper()
                customer.postal_code = address_details.get("postcode")

            customer.save()

            serializer = self.get_serializer(customer)
            return Response(
                {
                    "message": "Address geocoded successfully",
                    "customer": serializer.data,
                    "coordinates": {"lat": result["lat"], "lon": result["lon"]},
                }
            )
        else:
            return Response(
                {
                    "detail": "Failed to geocode address. Please check the address format."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def set_coordinates(self, request, pk=None):
        """Manually set customer GPS coordinates"""
        customer = self.get_object()

        lat = request.data.get("lat")
        lon = request.data.get("lon")

        if not lat or not lon:
            return Response(
                {"detail": "Both lat and lon are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lat = float(lat)
            lon = float(lon)
        except ValueError:
            return Response(
                {"detail": "Invalid coordinates format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not LocationService.validate_coordinates(lat, lon):
            return Response(
                {"detail": "Coordinates out of valid range"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update customer coordinates
        customer.lat = lat
        customer.lon = lon
        customer.location_verified = True
        customer.save()

        # Try to reverse geocode to get address details
        address_result = LocationService.reverse_geocode(lat, lon)
        if address_result:
            address_details = address_result.get("address", {})
            if address_details:
                customer.city = address_details.get("city") or address_details.get(
                    "town"
                )
                customer.state = address_details.get("state")
                customer.country = address_details.get("country_code", "").upper()
                customer.postal_code = address_details.get("postcode")
                customer.save()

        serializer = self.get_serializer(customer)
        return Response(
            {"message": "Coordinates set successfully", "customer": serializer.data}
        )

    @action(detail=False, methods=["get"])
    def nearby(self, request):
        """Find customers near a specific location"""
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")
        radius = request.query_params.get("radius", 10.0)  # Default 10km radius

        if not lat or not lon:
            return Response(
                {"detail": "Both lat and lon query parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lat = float(lat)
            lon = float(lon)
            radius = float(radius)
        except ValueError:
            return Response(
                {"detail": "Invalid coordinate or radius format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not LocationService.validate_coordinates(lat, lon):
            return Response(
                {"detail": "Coordinates out of valid range"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all customers with coordinates
        customers_with_coords = Customer.objects.filter(
            lat__isnull=False, lon__isnull=False
        )

        # Find nearby customers
        nearby_customers = LocationService.find_nearby_customers(
            lat, lon, customers_with_coords, radius
        )

        serializer = self.get_serializer(nearby_customers, many=True)
        return Response(
            {
                "center": {"lat": lat, "lon": lon},
                "radius_km": radius,
                "customers": serializer.data,
                "count": len(nearby_customers),
            }
        )

    @action(detail=False, methods=["get"])
    def with_coordinates(self, request):
        """Get all customers that have GPS coordinates"""
        customers = Customer.objects.filter(lat__isnull=False, lon__isnull=False)

        serializer = self.get_serializer(customers, many=True)
        return Response({"customers": serializer.data, "count": customers.count()})


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Supplier.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()


class VATSettingsViewSet(viewsets.ModelViewSet):
    queryset = VATSettings.objects.all()
    serializer_class = VATSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VATSettings.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

class CreditViewSet(viewsets.ModelViewSet):
    queryset = Credit.objects.all()
    serializer_class = CreditSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Credit.objects.filter(invoice__company=self.request.user.company)
    
    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()
    
    
class TestEndpoint(APIView):
    permission_classes = []
    
    def get(self, request):
        print("=" * 50)
        print("DEBUG: Test endpoint called!")
        return Response({"message": "Test endpoint working!"})

class CustomerAvailableForSales(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        print("=" * 50)
        print("DEBUG: CustomerAvailableForSales endpoint called!")
        print(f"DEBUG: Request method: {request.method}")
        print(f"DEBUG: Request path: {request.path}")
        print(f"DEBUG: Request user: {request.user}")
        print(f"DEBUG: User authenticated: {request.user.is_authenticated}")
        print(f"DEBUG: User company: {getattr(request.user, 'company', 'No company attribute')}")
        
        try:
            # Get all customers for the company first
            all_customers = Customer.objects.filter(company=request.user.company)
            print(f"DEBUG: Found {all_customers.count()} total customers for company")
            
            # Filter customers who can order (using the property)
            available_customers = [customer for customer in all_customers if customer.can_order]
            print(f"DEBUG: Found {len(available_customers)} customers with can_order=True")
            
            serializer = CustomerSerializer(available_customers, many=True)
            print(f"DEBUG: Serialized data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            print(f"DEBUG: Error in CustomerAvailableForSales: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
        

class CreditReport(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role != "admin" :
            print(user.role)
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get all customers with their credit information
            customers_with_credits = Customer.objects.filter(
                company=user.company
            ).prefetch_related(
                'sales_orders__invoice__credits',
                'sales_orders__invoice__payments'
            )
            
            credit_reports = []
            
            for customer in customers_with_credits:
                # Get all credits for this customer
                credits = Credit.objects.filter(
                    invoice__sales_order__customer=customer,
                    invoice__company=user.company
                ).select_related('invoice').order_by('created_at')
                
                if not credits.exists():
                    continue
                
                # Calculate total credit and remaining credit properly
                total_credit = sum(float(credit.amount) for credit in credits)
                total_paid = sum(float(credit.payed_amount or 0) for credit in credits)
                credit_left = total_credit - total_paid
                
                # Get the most recent credit for display
                latest_credit = credits.last()
                invoice_no = latest_credit.invoice.invoice_no if latest_credit else "N/A"
                expires_at = latest_credit.expired_at.strftime('%Y-%m-%d') if latest_credit and latest_credit.expired_at else None
                
                # Build credit history - show each credit grant
                credit_history = []
                for credit in credits:
                    credit_history.append({
                        'id': credit.id,
                        'date': credit.created_at.strftime('%Y-%m-%d'),
                        'amount': float(credit.amount),
                        'invoiceNo': credit.invoice.invoice_no,
                        'type': 'Credit Grant',
                        'status': 'Granted'
                    })
                
                # Build payment history - get all payments for this customer
                payment_history = []
                all_payments = Payment.objects.filter(
                    invoice__sales_order__customer=customer,
                    invoice__company=user.company
                ).order_by('paid_on')
                
                for payment in all_payments:
                    payment_history.append({
                        'date': payment.paid_on.strftime('%Y-%m-%d'),
                        'amount': float(payment.amount),
                        'invoiceNo': f"{payment.invoice.invoice_no}",
                        'type': 'Payment',
                        'method': payment.mode.title()
                    })
                
                credit_report = {
                    'id': customer.id,
                    'customerName': customer.name,
                    'totalCredit': total_credit,
                    'creditLeft': credit_left,
                    'invoiceNo': invoice_no,
                    'expiresAt': expires_at,
                    'creditHistory': credit_history,
                    'paymentHistory': payment_history
                }
                
                credit_reports.append(credit_report)
            
            return Response({
                'creditReports': credit_reports,
                'totalCustomers': len(credit_reports)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error generating credit report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ExternalCreditReport(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "admin":
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )
        print(request.data)
        credit_id = request.data.get("credit_id")
        new_expired_at = request.data.get("new_expired_at")

        if not credit_id or not new_expired_at:
            return Response(
                {"detail": "Both 'credit_id' and 'new_expired_at' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse datetime safely
        expired_at = parse_datetime(new_expired_at)
        if not expired_at:
            return Response(
                {"detail": "Invalid datetime format for 'new_expired_at'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch credit by credit ID or return 404
        credit = get_object_or_404(Credit, id=credit_id)
        credit.expired_at = expired_at
        credit.save(update_fields=["expired_at"])

        return Response(
            {"detail": f"Credit {credit_id} expiration updated successfully."},
            status=status.HTTP_200_OK,
        )