from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from .models import SalesOrder, PurchaseOrder
    
from collections import defaultdict
from decimal import Decimal
from django.db.models import DecimalField
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import status
from django.db.models import Sum, Count, Avg, F, Case, When
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import action
from rest_framework.response import Response

from main.models import Customer
from .models import Invoice, OrderLineItem, Payment, PurchaseOrder, Route, RouteVisit, SalesOrder, RouteLocationPing
from .serializers import (
    InvoiceSerializer, PaymentSerializer, PurchaseOrderSerializer,
    RouteSerializer, RouteVisitSerializer, SalesOrderSerializer,
    RouteLocationPingSerializer, CustomerSerializer
)
from audit.signals import AuditContext


# Sales Order Report API
class SalesOrderReportView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start = request.GET.get('start')
        end = request.GET.get('end')
        qs = SalesOrder.objects.filter(company = request.user.company)
        if start and end:
            qs = qs.filter(order_date__gte=start, order_date__lte=end)
        data = qs.aggregate(
            total_sales=Sum('grand_total'),
            total_profit=Sum('profit'),
            order_count=Count('id')
        )
        return Response(data)

# Purchase Order Report API
class PurchaseOrderReportView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start = request.GET.get('start')
        end = request.GET.get('end')
        qs = PurchaseOrder.objects.filter(company = request.user.company)
        if start and end:
            qs = qs.filter(order_date__gte=start, order_date__lte=end)
        data = qs.aggregate(
            total_purchases=Sum('grand_total'),
            order_count=Count('id')
        )
        return Response(data)
    
class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(company=self.request.user.company)
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # Filter by salesperson if applicable
        if role == 'salesperson':
            qs = qs.filter(created_by=user)
        
        # Check if we should only return orders without invoices
        no_invoice = self.request.query_params.get('no_invoice', '').lower() == 'true'
        if no_invoice:
            return qs.filter(invoice__isnull=True)
            
        return qs

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company, created_by=self.request.user)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    @action(detail=True, methods=["get"])
    def profit(self, request, pk=None):
        """Return computed profit for this order."""
        order = self.get_object()
        return Response({"profit": str(order.profit)})

    @action(detail=False, methods=["post"])
    def create_from_route(self, request):
        """Create a sales order in the context of a route visit"""
        user = request.user
        route_id = request.data.get('route_id')
        customer_id = request.data.get('customer_id')
        
        if not route_id or not customer_id:
            return Response(
                {'detail': 'route_id and customer_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user is the salesperson for this route
        try:
            route = Route.objects.get(id=route_id, salesperson=user)
        except Route.DoesNotExist:
            return Response(
                {'detail': 'Route not found or access denied'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create route visit for this customer
        route_visit, created = RouteVisit.objects.get_or_create(
            route=route,
            customer_id=customer_id,
            defaults={'status': 'visited'}
        )
        
        # Create sales order
        order_data = request.data.copy()
        order_data['customer'] = customer_id
        order_data['order_date'] = order_data.get('order_date', timezone.now().date())
        order_data['company'] = request.user.company

        serializer = self.get_serializer(data=order_data)
        if serializer.is_valid():
            order = serializer.save()
            
            # Link order to route visit
            route_visit.sales_orders.add(order)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()
    
    
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(company=self.request.user.company)
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            # Filter by route visits where user is the salesperson
            return qs.filter(sales_order__route_visits__route__salesperson=user).distinct()
        return qs

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    def has_write_access(self):
        """Check if the current user has write access to invoices"""
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # Admin users have full access
        if role == 'admin':
            return True
        
        # Salesperson users can only modify invoices from their own routes
        if role == 'salesperson':
            return True  # They can modify invoices they have access to via get_queryset filtering
        
        # Default to False for unknown roles
        return False

    def update(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def available_sales_orders(self, request):
        """Get list of sales orders that don't have invoices yet"""
        user = request.user
        role = getattr(user, 'role', '')
        
        # Start with all sales orders for the company
        qs = SalesOrder.objects.filter(company=user.company, invoice__isnull=True)
        
        # Filter by salesperson if applicable
        if role == 'salesperson':
            qs = qs.filter(created_by=user)
            
        # Only show confirmed orders that don't have invoices
        qs = qs.filter(status='confirmed')
        
        from .serializers import SalesOrderSerializer
        serializer = SalesOrderSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def refresh_outstanding(self, request, pk=None):
        """Manually refresh the outstanding amount for an invoice"""
        try:
            invoice = self.get_object()
            invoice.update_payment_status()
            
            return Response({
                'message': 'Invoice outstanding amount refreshed',
                'invoice_no': invoice.invoice_no,
                'paid_amount': str(invoice.paid_amount),
                'outstanding': str(invoice.outstanding),
                'status': invoice.status
            })
        except Exception as e:
            return Response({'detail': f'Error refreshing invoice: {str(e)}'}, status=500)

    @action(detail=False, methods=['post'])
    def refresh_all_outstanding(self, request):
        """Refresh outstanding amounts for all invoices"""
        try:
            invoices = self.get_queryset()
            updated_count = 0
            
            for invoice in invoices:
                invoice.update_payment_status()
                updated_count += 1
            
            return Response({
                'message': f'Refreshed outstanding amounts for {updated_count} invoices',
                'updated_count': updated_count
            })
        except Exception as e:
            return Response({'detail': f'Error refreshing invoices: {str(e)}'}, status=500)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(company=self.request.user.company)
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            return qs.filter(invoice__sales_order__route_visits__route__salesperson=user)
        return qs

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    def has_write_access(self):
        """Check if the current user has write access to payments"""
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # Admin users have full access
        if role == 'admin':
            return True
        
        # Salesperson users can only modify payments from their own routes
        if role == 'salesperson':
            return True  # They can modify payments they have access to via get_queryset filtering
        
        # Default to False for unknown roles
        return False

    def update(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.has_write_access():
            return Response({'detail': 'Forbidden'}, status=403)
        return super().destroy(request, *args, **kwargs)
    

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(company=self.request.user.company)
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            return qs.filter(salesperson=user)
        return qs

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    @action(detail=True, methods=["get"])
    def visits(self, request, pk=None):
        route = self.get_object()
        visits = route.visits.all()
        serializer = RouteVisitSerializer(visits, many=True)
        return Response(serializer.data)


class RouteVisitViewSet(viewsets.ModelViewSet):
    queryset = RouteVisit.objects.all()
    serializer_class = RouteVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(company=self.request.user.company)
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # Filter by salesperson role
        if role == 'salesperson':
            qs = qs.filter(route__salesperson=user)
        
        # Apply additional filters from query parameters
        route_id = self.request.query_params.get('route')
        customer_id = self.request.query_params.get('customer')
        status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if route_id:
            qs = qs.filter(route_id=route_id)
        
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        
        if status:
            qs = qs.filter(status=status)
        
        if date_from:
            qs = qs.filter(route__date__gte=date_from)
        
        if date_to:
            qs = qs.filter(route__date__lte=date_to)
        
        return qs.select_related('route', 'customer').prefetch_related('sales_orders')

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in to a route visit"""
        route_visit = self.get_object()
        
        # Validate that the current user is the salesperson for this route
        if hasattr(request.user, 'role') and request.user.role == 'salesperson':
            if route_visit.route.salesperson != request.user:
                return Response(
                    {'detail': 'You can only check in to your own route visits'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get location data from request
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        
        # Update check-in information
        route_visit.check_in = timezone.now()
        route_visit.status = 'visited'
        
        if lat and lon:
            route_visit.lat = lat
            route_visit.lon = lon
        
        route_visit.save()
        
        serializer = self.get_serializer(route_visit)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check out from a route visit"""
        route_visit = self.get_object()
        
        # Validate that the current user is the salesperson for this route
        if hasattr(request.user, 'role') and request.user.role == 'salesperson':
            if route_visit.route.salesperson != request.user:
                return Response(
                    {'detail': 'You can only check out from your own route visits'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Update check-out information
        route_visit.check_out = timezone.now()
        
        # Calculate visit duration if check-in exists
        if route_visit.check_in and route_visit.check_out:
            duration = route_visit.check_out - route_visit.check_in
            route_visit.visit_duration_minutes = int(duration.total_seconds() / 60)
        
        # Add notes if provided
        notes = request.data.get('notes')
        if notes:
            if route_visit.notes:
                route_visit.notes += f"\n\n{notes}"
            else:
                route_visit.notes = notes
        
        # Handle payment information
        payment_collected = request.data.get('payment_collected', False)
        if payment_collected:
            route_visit.payment_collected = True
            payment_amount = request.data.get('payment_amount')
            if payment_amount:
                route_visit.payment_amount = payment_amount
        
        # Handle issues reported
        issues_reported = request.data.get('issues_reported')
        if issues_reported:
            route_visit.issues_reported = issues_reported
        
        route_visit.save()
        
        serializer = self.get_serializer(route_visit)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_sales_order(self, request, pk=None):
        """Add a sales order to a route visit"""
        route_visit = self.get_object()
        sales_order_id = request.data.get('sales_order_id')
        
        if not sales_order_id:
            return Response(
                {'detail': 'sales_order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sales_order = SalesOrder.objects.get(id=sales_order_id)
            
            # Validate that the sales order belongs to the same customer
            if sales_order.customer != route_visit.customer:
                return Response(
                    {'detail': 'Sales order must belong to the same customer as the route visit'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            route_visit.sales_orders.add(sales_order)
            
            serializer = self.get_serializer(route_visit)
            return Response(serializer.data)
            
        except SalesOrder.DoesNotExist:
            return Response(
                {'detail': 'Sales order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['delete'])
    def remove_sales_order(self, request, pk=None):
        """Remove a sales order from a route visit"""
        route_visit = self.get_object()
        sales_order_id = request.query_params.get('sales_order_id')
        
        if not sales_order_id:
            return Response(
                {'detail': 'sales_order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sales_order = SalesOrder.objects.get(id=sales_order_id)
            route_visit.sales_orders.remove(sales_order)
            
            serializer = self.get_serializer(route_visit)
            return Response(serializer.data)
            
        except SalesOrder.DoesNotExist:
            return Response(
                {'detail': 'Sales order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """Get route visits within a date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'detail': 'start_date and end_date are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            queryset = self.get_queryset().filter(
                route__date__gte=start,
                route__date__lte=end
            )
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except ValueError:
            return Response(
                {'detail': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    

class RouteLocationPingViewSet(viewsets.ModelViewSet):
    queryset = RouteLocationPing.objects.all()
    serializer_class = RouteLocationPingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset().filter(company=self.request.user.company)
        user = self.request.user
        role = getattr(user, 'role', '')
        # Salespeople can only view their own route pings
        if role == 'salesperson':
            qs = qs.filter(route__salesperson=user)
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        # Ensure current user is set for audit logging
        with AuditContext(self.request.user):
            serializer.save()

    @action(detail=False, methods=['get'])
    def route_summary(self, request):
        """Get route summary and optimization metrics - FIXED VERSION"""
        route_id = request.query_params.get('route_id')
        if not route_id:
            return Response({'error': 'route_id is required'}, status=400)
        
        try:
            # Get route first to ensure it exists
            try:
                route = Route.objects.get(id=route_id)
            except Route.DoesNotExist:
                return Response({'error': 'Route not found'}, status=404)
            
            # Get all pings for the route
            pings = self.get_queryset().filter(route_id=route_id).order_by('created_at')
            
            # Initialize default summary
            default_summary = {
                'total_distance_km': 0.0,
                'total_time_hours': 0.0,
                'average_speed_kmh': 0.0,
                'max_speed_kmh': 0.0,
                'ping_count': 0,
                'start_time': None,
                'end_time': None,
                'movement_efficiency_percent': 0.0
            }
            
            # Initialize default optimization
            default_optimization = {
                'efficiency_percentage': 100.0,
                'actual_distance_km': 0.0,
                'optimal_distance_km': 0.0,
                'deviation_km': 0.0,
                'fuel_consumption_liters': 0.0,
                'estimated_fuel_cost': 0.0,
                'time_efficiency': 'Unknown',
                'efficiency_rating': 'No Data'
            }
            
            if not pings.exists():
                print(f"No pings found for route {route_id}")
                return Response({
                    'summary': default_summary,
                    'optimization': default_optimization,
                    'message': 'No location data available for this route yet'
                })
            
            # Calculate route summary
            total_distance = 0.0
            total_time = 0.0
            speeds = []
            moving_time = 0.0
            
            pings_list = list(pings)
            
            for i in range(1, len(pings_list)):
                prev_ping = pings_list[i-1]
                curr_ping = pings_list[i]
                
                # Calculate distance between consecutive pings
                distance = self._calculate_distance(
                    prev_ping.lat, prev_ping.lon,
                    curr_ping.lat, curr_ping.lon
                )
                total_distance += distance
                
                # Calculate time difference
                time_diff = (curr_ping.created_at - prev_ping.created_at).total_seconds()
                total_time += time_diff / 3600  # Convert to hours
                
                # Only count as moving time if there's significant movement
                if distance > 0.01:  # More than 10 meters
                    moving_time += time_diff / 3600
                
                # Calculate speed from GPS data or calculate from distance/time
                if curr_ping.speed_mps and curr_ping.speed_mps > 0:
                    speed_kmh = float(curr_ping.speed_mps) * 3.6
                    speeds.append(speed_kmh)
                elif time_diff > 0 and distance > 0:
                    # Calculate speed from distance and time
                    speed_kmh = (distance / (time_diff / 3600))
                    if speed_kmh <= 120:  # Filter out unrealistic speeds
                        speeds.append(speed_kmh)
            
            # Calculate metrics
            average_speed = sum(speeds) / len(speeds) if speeds else 0
            max_speed = max(speeds) if speeds else 0
            movement_efficiency = (moving_time / total_time * 100) if total_time > 0 else 0
            
            # Build summary
            summary = {
                'total_distance_km': round(total_distance, 2),
                'total_time_hours': round(total_time, 2),
                'moving_time_hours': round(moving_time, 2),
                'average_speed_kmh': round(average_speed, 1),
                'max_speed_kmh': round(max_speed, 1),
                'ping_count': len(pings_list),
                'start_time': pings_list[0].created_at.isoformat(),
                'end_time': pings_list[-1].created_at.isoformat(),
                'movement_efficiency_percent': round(movement_efficiency, 1)
            }
            
            # Calculate optimization metrics
            try:
                route_visits = route.visits.all()
                optimal_distance = 0.0
                
                if route_visits.count() > 1:
                    visits_with_coords = [v for v in route_visits if v.lat and v.lon]
                    for i in range(1, len(visits_with_coords)):
                        optimal_distance += self._calculate_distance(
                            visits_with_coords[i-1].lat, visits_with_coords[i-1].lon,
                            visits_with_coords[i].lat, visits_with_coords[i].lon
                        )
                
                # Calculate efficiency metrics with safety checks
                if optimal_distance > 0 and total_distance > 0:
                    deviation = max(0, total_distance - optimal_distance)
                    efficiency_percentage = min(100, (optimal_distance / total_distance * 100))
                elif total_distance == 0:
                    deviation = 0
                    efficiency_percentage = 100
                else:
                    deviation = total_distance
                    efficiency_percentage = 0
                
                # Estimate fuel consumption (assuming 8L/100km average)
                fuel_consumption = (total_distance / 100) * 8 if total_distance > 0 else 0
                fuel_cost = fuel_consumption * 1.5  # Assuming $1.5/L
                
                # Determine efficiency rating
                if efficiency_percentage > 90:
                    efficiency_rating = 'Excellent'
                elif efficiency_percentage > 75:
                    efficiency_rating = 'Good'
                elif efficiency_percentage > 60:
                    efficiency_rating = 'Fair'
                else:
                    efficiency_rating = 'Poor'
                
                optimization_data = {
                    'efficiency_percentage': round(efficiency_percentage, 1),
                    'actual_distance_km': round(total_distance, 2),
                    'optimal_distance_km': round(optimal_distance, 2),
                    'deviation_km': round(deviation, 2),
                    'fuel_consumption_liters': round(fuel_consumption, 1),
                    'estimated_fuel_cost': round(fuel_cost, 2),
                    'efficiency_rating': efficiency_rating
                }
                
            except Exception as e:
                print(f"Error calculating optimization metrics: {e}")
                optimization_data = default_optimization
            
            return Response({
                'summary': summary,
                'optimization': optimization_data
            })
            
        except Exception as e:
            print(f"Error in route_summary: {e}")
            return Response({
                'summary': default_summary,
                'optimization': default_optimization,
                'error': f'Error calculating route summary: {str(e)}'
            }, status=500)
    
    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates using Haversine formula"""
        try:
            from math import radians, cos, sin, asin, sqrt
            
            # Convert to float and then radians
            lat1, lon1, lat2, lon2 = map(lambda x: radians(float(x)), [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            
            # Radius of earth in kilometers
            r = 6371
            
            return c * r
        except Exception as e:
            print(f"Error calculating distance: {e}")
            return 0.0

    @action(detail=False, methods=['post'])
    def start_route_tracking(self, request):
        """Start tracking a route - IMPROVED VERSION"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Check permissions
            if hasattr(user, 'role') and user.role == 'salesperson' and route.salesperson != user:
                return Response({'detail': 'You can only track your own routes'}, status=403)
            
            # Check if tracking is already active (within last 30 minutes)
            from django.utils import timezone
            active_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__gte=timezone.now() - timezone.timedelta(minutes=30)
            ).order_by('-created_at')
            
            if active_pings.exists():
                last_ping = active_pings.first()
                return Response({
                    'message': 'Route tracking already active - continuing existing session',
                    'route_id': str(route.id),
                    'route_name': route.name,
                    'tracking_id': str(last_ping.id),
                    'last_ping': last_ping.created_at,
                    'status': 'active'
                })
            
            return Response({
                'message': 'Route tracking started - you can now send GPS pings',
                'route_id': str(route.id),
                'route_name': route.name,
                'start_time': timezone.now(),
                'status': 'started'
            })
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    @action(detail=False, methods=['post'])
    def stop_route_tracking(self, request):
        """Stop tracking a route and calculate summary - IMPROVED VERSION"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Check permissions
            if hasattr(user, 'role') and user.role == 'salesperson' and route.salesperson != user:
                return Response({'detail': 'You can only track your own routes'}, status=403)
            
            # Get all pings for today
            from django.utils import timezone
            today_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__date=timezone.now().date()
            ).order_by('created_at')
            
            if not today_pings.exists():
                return Response({
                    'message': 'Route tracking stopped - no GPS data was recorded',
                    'route_id': str(route.id),
                    'route_name': route.name,
                    'summary': None
                })
            
            # Get basic summary stats
            ping_count = today_pings.count()
            start_time = today_pings.first().created_at
            end_time = today_pings.last().created_at
            duration = end_time - start_time
            
            return Response({
                'message': 'Route tracking stopped and summary generated',
                'route_id': str(route.id),
                'route_name': route.name,
                'basic_summary': {
                    'ping_count': ping_count,
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration_minutes': duration.total_seconds() / 60
                }
            })
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    #rolebased location tracking aakan vendi admin monitoring only salesperson tracking
    @action(detail=False, methods=['post'])
    def start_route_monitoring(self, request):
        """Start monitoring a route (admin-only, no GPS tracking)"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Only allow admin users to monitor
            if hasattr(user, 'role') and user.role != 'admin':
                return Response({'detail': 'Only admin users can monitor routes'}, status=403)
            
            # Check if the route has an active salesperson tracking session
            from django.utils import timezone
            recent_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__gte=timezone.now() - timezone.timedelta(hours=24)
            ).order_by('-created_at')
            
            monitoring_status = {
                'message': 'Route monitoring started - watching for updates from salesperson',
                'route_id': str(route.id),
                'route_name': route.name,
                'salesperson': route.salesperson.email if route.salesperson else 'Unknown',
                'start_time': timezone.now(),
                'status': 'monitoring',
                'recent_activity': recent_pings.exists()
            }
            
            if recent_pings.exists():
                last_ping = recent_pings.first()
                monitoring_status.update({
                    'last_ping': last_ping.created_at,
                    'last_location': {
                        'lat': float(last_ping.lat),
                        'lon': float(last_ping.lon)
                    }
                })
            
            return Response(monitoring_status)
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    @action(detail=False, methods=['post'])
    def stop_route_monitoring(self, request):
        """Stop monitoring a route"""
        route_id = request.data.get('route_id')
        if not route_id:
            return Response({'detail': 'route_id is required'}, status=400)
        
        try:
            route = Route.objects.get(id=route_id)
            user = request.user
            
            # Only allow admin users to stop monitoring
            if hasattr(user, 'role') and user.role != 'admin':
                return Response({'detail': 'Only admin users can stop monitoring'}, status=403)
            
            # Get monitoring summary for today
            from django.utils import timezone
            today_pings = RouteLocationPing.objects.filter(
                route=route,
                created_at__date=timezone.now().date()
            ).order_by('created_at')
            
            summary = {
                'message': 'Route monitoring stopped',
                'route_id': str(route.id),
                'route_name': route.name,
                'monitoring_summary': {
                    'ping_count': today_pings.count(),
                    'monitoring_stopped': timezone.now()
                }
            }
            
            if today_pings.exists():
                summary['monitoring_summary'].update({
                    'first_ping': today_pings.first().created_at,
                    'last_ping': today_pings.last().created_at,
                    'salesperson_active': True
                })
            else:
                summary['monitoring_summary']['salesperson_active'] = False
            
            return Response(summary)
            
        except Route.DoesNotExist:
            return Response({'detail': 'Route not found'}, status=404)

    @action(detail=False, methods=['get'])
    def monitoring_status(self, request):
        """Get current monitoring status for all active routes (admin-only)"""
        user = request.user
        
        # Only allow admin users
        if hasattr(user, 'role') and user.role != 'admin':
            return Response({'detail': 'Admin access required'}, status=403)
        
        from django.utils import timezone
        today = timezone.now().date()
        
        # Get all routes with activity today
        active_routes = Route.objects.filter(
            location_pings__created_at__date=today
        ).distinct().select_related('salesperson')
        
        monitoring_data = []
        for route in active_routes:
            recent_pings = route.location_pings.filter(
                created_at__date=today
            ).order_by('-created_at')
            
            if recent_pings.exists():
                last_ping = recent_pings.first()
                first_ping = recent_pings.last()
                
                # Check if still active (ping within last 30 minutes)
                is_active = (timezone.now() - last_ping.created_at).total_seconds() < 1800
                
                route_data = {
                    'route_id': str(route.id),
                    'route_name': route.name,
                    'route_number': route.route_number,
                    'salesperson': route.salesperson.email if route.salesperson else 'Unknown',
                    'date': route.date,
                    'is_active': is_active,
                    'ping_count': recent_pings.count(),
                    'first_ping': first_ping.created_at,
                    'last_ping': last_ping.created_at,
                    'last_location': {
                        'lat': float(last_ping.lat),
                        'lon': float(last_ping.lon)
                    },
                    'time_since_last_ping': (timezone.now() - last_ping.created_at).total_seconds() / 60  # minutes
                }
                
                monitoring_data.append(route_data)
        
        return Response({
            'monitoring_date': today,
            'active_routes': len(monitoring_data),
            'routes': monitoring_data
        })

    @action(detail=False, methods=['get'])
    def live_tracking_status(self, request):
        """Get real-time status of all routes being tracked today"""
        from django.utils import timezone
        from django.db.models import Count, Max, Min
        
        user = request.user
        role = getattr(user, 'role', '')
        
        today = timezone.now().date()
        
        # Base query for routes with pings today - ALWAYS filter by company for security
        routes_query = Route.objects.filter(
            location_pings__created_at__date=today,
            company=user.company  
        ).select_related('salesperson').annotate(
            ping_count=Count('location_pings'),
            last_ping_time=Max('location_pings__created_at'),
            first_ping_time=Min('location_pings__created_at')
        ).distinct()
        
        # Apply role-based filtering
        if role == 'salesperson':
            routes_query = routes_query.filter(salesperson=user)
        
        active_routes = []
        for route in routes_query:
            # Get the most recent ping
            last_ping = route.location_pings.filter(
                created_at__date=today
            ).order_by('-created_at').first()
            
            if last_ping:
                # Determine if route is currently active (ping within last 30 minutes)
                time_since_last = (timezone.now() - last_ping.created_at).total_seconds()
                is_currently_active = time_since_last < 1800  # 30 minutes
                
                # Calculate basic stats
                total_time = 0
                if route.first_ping_time and route.last_ping_time:
                    total_time = (route.last_ping_time - route.first_ping_time).total_seconds() / 3600  # hours
                
                route_status = {
                    'route_id': str(route.id),
                    'route_name': route.name,
                    'route_number': route.route_number,
                    'date': str(route.date),
                    'salesperson': {
                        'name': route.salesperson.email if route.salesperson else 'Unknown',
                        'id': route.salesperson.id if route.salesperson else None
                    },
                    'status': {
                        'is_active': is_currently_active,
                        'ping_count': route.ping_count,
                        'first_ping': route.first_ping_time,
                        'last_ping': route.last_ping_time,
                        'total_time_hours': round(total_time, 2),
                        'minutes_since_last_ping': round(time_since_last / 60, 1)
                    },
                    'last_location': {
                        'lat': float(last_ping.lat),
                        'lon': float(last_ping.lon),
                        'accuracy': float(last_ping.accuracy_meters) if last_ping.accuracy_meters else None
                    }
                }
                
                active_routes.append(route_status)
        
        # Sort by last ping time (most recent first)
        active_routes.sort(key=lambda x: x['status']['last_ping'], reverse=True)
        
        # Summary statistics
        total_routes = len(active_routes)
        currently_active = len([r for r in active_routes if r['status']['is_active']])
        
        return Response({
            'date': today,
            'summary': {
                'total_routes_today': total_routes,
                'currently_active': currently_active,
                'inactive_routes': total_routes - currently_active
            },
            'routes': active_routes,
            'user_role': role,
            'last_updated': timezone.now()
        })
        
        
        
class VATReportView(APIView):
    """
    GET /api/transactions/vat-report/?start=YYYY-MM-DD&end=YYYY-MM-DD
    Returns FTA-compliant VAT summary.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        # Parse and validate date parameters
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        
        if not (start and end):
            return Response(
                {"detail": "start & end query parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle VAT-inclusive vs exclusive pricing logic
        line_items = (
            OrderLineItem.objects
            .select_related('product__vat_category', 'sales_order')
            .filter(
                sales_order__invoice__issue_date__gte=start,
                sales_order__invoice__issue_date__lte=end,
                sales_order__company=request.user.company
            )
            .annotate(
                vat_rate=F('product__vat_category__rate'),
                vat_category=F('product__vat_category__category'),
                prices_include_vat=F('sales_order__prices_include_vat'),
                # Calculate net amount and VAT based on pricing model
                net_amount=Case(
                    # When prices include VAT: net = gross / (1 + rate/100)
                    When(
                        sales_order__prices_include_vat=True,
                        product__vat_category__rate__gt=0,
                        then=F('line_total') / (1 + F('product__vat_category__rate') / 100)
                    ),
                    # When prices exclude VAT or rate is 0: net = gross
                    default=F('line_total'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                ),
                vat_amount=Case(
                    # When prices include VAT: vat = gross - net
                    When(
                        sales_order__prices_include_vat=True,
                        product__vat_category__rate__gt=0,
                        then=F('line_total') - (F('line_total') / (1 + F('product__vat_category__rate') / 100))
                    ),
                    # When prices exclude VAT: vat = net * rate/100
                    When(
                        product__vat_category__rate__isnull=False,
                        then=F('line_total') * F('product__vat_category__rate') / 100
                    ),
                    default=Decimal('0.00'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                )
            )
            .values('vat_category', 'net_amount', 'vat_amount')
        )
        
        # Initialize report structure
        report = {
            "period_start": str(start),
            "period_end": str(end),
        }
        
        # Use defaultdict for cleaner aggregation
        category_totals = defaultdict(lambda: {"sales": Decimal('0.00'), "vat": Decimal('0.00')})
        
        # Aggregate data efficiently
        for item in line_items:
            category = item['vat_category'] or 'uncategorized'
            category_totals[category]["sales"] += Decimal(str(item['net_amount'] or 0))
            category_totals[category]["vat"] += Decimal(str(item['vat_amount'] or 0))
        
        # Convert to the expected format and ensure float conversion for JSON serialization
        for category, totals in category_totals.items():
            report[category] = {
                "sales": float(totals["sales"]),
                "vat": float(totals["vat"])
            }
        
        return Response(report, status=status.HTTP_200_OK)

class SalesVsPurchaseReportView(APIView):
    """Sales vs Purchase comparison report"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        
        if not (start and end):
            return Response({"detail": "start & end required"}, status=400)
        
        # Sales data
        sales_data = SalesOrder.objects.filter(
            order_date__gte=start, order_date__lte=end,company=request.user.company
        ).aggregate(
            total_sales=Sum('grand_total'),
            total_profit=Sum('profit'),
            order_count=Count('id')
        )
        
        # Purchase data  
        purchase_data = PurchaseOrder.objects.filter(
            order_date__gte=start, order_date__lte=end, company=request.user.company
        ).aggregate(
            total_purchases=Sum('grand_total'),
            order_count=Count('id')
        )
        print({
            "period": {"start": start, "end": end},
            "sales": sales_data,
            "purchases": purchase_data,
            "net_profit": (sales_data.get('total_sales', 0) or 0) - (purchase_data.get('total_purchases', 0) or 0)
        })
        return Response({
            "period": {"start": start, "end": end},
            "sales": sales_data,
            "purchases": purchase_data,
            "net_profit": (sales_data.get('total_sales', 0) or 0) - (purchase_data.get('total_purchases', 0) or 0)
        })

class RouteEfficiencyReportView(APIView):
    """Route efficiency and performance reports"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start = parse_date(request.GET.get("start", ""))
        end = parse_date(request.GET.get("end", ""))
        
        routes = Route.objects.filter(date__gte=start, date__lte=end, company=request.user.company)
        
        report_data = []
        for route in routes:
            visits = route.visits.all()
            total_visits = visits.count()
            completed_visits = visits.filter(status='visited').count()
            
            report_data.append({
                "route_id": route.id,
                "route_name": route.name,
                "salesperson": route.salesperson.email,
                "date": route.date,
                "total_planned": total_visits,
                "completed": completed_visits,
                "completion_rate": (completed_visits / total_visits * 100) if total_visits > 0 else 0,
                "missed": visits.filter(status='missed').count()
            })
        
        return Response(report_data)

class OutstandingPaymentsView(APIView):
    """Outstanding payments by customer"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all invoices that have outstanding amounts
        invoices = Invoice.objects.select_related('sales_order__customer').filter(company=request.user.company)

        customer_outstanding = {}
        for invoice in invoices:
            outstanding = invoice.outstanding
            if outstanding > 0:  # Only include invoices with outstanding amounts
                customer = invoice.sales_order.customer
                if customer.id not in customer_outstanding:
                    customer_outstanding[customer.id] = {
                        "customer_name": customer.name,
                        "customer_email": customer.email,
                        "total_outstanding": 0,
                        "invoice_count": 0
                    }
                
                customer_outstanding[customer.id]["total_outstanding"] += float(outstanding)
                customer_outstanding[customer.id]["invoice_count"] += 1
        
        # Format the amounts properly
        result = []
        for customer_data in customer_outstanding.values():
            customer_data["total_outstanding"] = round(customer_data["total_outstanding"], 2)
            result.append(customer_data)
        
        return Response(result)
    
class CustomerViewSet(viewsets.ModelViewSet):
    """Customer ViewSet with proper CRUD operations"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # If salesperson, only show customers they've interacted with
        if role == 'salesperson':
            qs = qs.filter(sales_orders__salesperson=user).distinct()
        
        return qs


class CustomerDetailView(generics.RetrieveAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return super().get_queryset().filter(company=self.request.user.company)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# Update CustomerSalesOrdersView
class CustomerSalesOrdersView(generics.ListAPIView):
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs['customer_id']
        qs = SalesOrder.objects.filter(customer_id=customer_id, company=self.request.user.company)
        
        # Apply role-based filtering
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            qs = qs.filter(salesperson=user)
            
        return qs.select_related('customer').prefetch_related('line_items__product')

# Update CustomerInvoicesView
class CustomerInvoicesView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs['customer_id']
        qs = Invoice.objects.filter(sales_order__customer_id=customer_id, company=self.request.user.company)
        
        # Apply role-based filtering
        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'salesperson':
            qs = qs.filter(sales_order__salesperson=user)
            
        return qs.select_related('sales_order__customer').prefetch_related('payments')

# Add a comprehensive customer summary view
class CustomerSummaryView(APIView):
    """Get comprehensive customer data in one call"""
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
            
            # Get sales orders
            sales_orders = SalesOrder.objects.filter(customer=customer)
            
            # Get invoices
            invoices = Invoice.objects.filter(sales_order__customer=customer)
            
            # Apply role-based filtering
            user = request.user
            role = getattr(user, 'role', '')
            if role == 'salesperson':
                sales_orders = sales_orders.filter(salesperson=user)
                invoices = invoices.filter(sales_order__salesperson=user)
            
            # Serialize data
            customer_data = CustomerSerializer(customer).data
            orders_data = SalesOrderSerializer(sales_orders, many=True).data
            invoices_data = InvoiceSerializer(invoices, many=True).data
            
            # Calculate summary statistics
            total_orders = sales_orders.count()
            pending_orders = sales_orders.filter(status='confirmed').count()
            total_spent = sales_orders.aggregate(total=Sum('grand_total'))['total'] or 0
            outstanding_balance = sum(float(inv.outstanding) for inv in invoices)
            
            return Response({
                'customer': customer_data,
                'orders': orders_data,
                'invoices': invoices_data,
                'summary': {
                    'total_orders': total_orders,
                    'pending_orders': pending_orders,
                    'total_spent': float(total_spent),
                    'outstanding_balance': outstanding_balance,
                    'paid_invoices': invoices.filter(status='paid').count(),
                    'overdue_invoices': invoices.filter(status='overdue').count()
                }
            })
            
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


class SalesOrdersAvailableRouteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        sales_orders = SalesOrder.objects.filter(company=request.user.company, gone_for_delivery=False)
        serializer = SalesOrderSerializer(sales_orders, many=True)
        return Response(serializer.data)