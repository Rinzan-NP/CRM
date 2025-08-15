from rest_framework import serializers
from .models import Invoice, Payment, PurchaseOrder, PurchaseOrderLineItem, Route, RouteVisit, SalesOrder, OrderLineItem, RouteLocationPing
from main.models import Customer, Product
from main.serializers import CustomerSerializer, ProductSerializer

class OrderLineItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = OrderLineItem
        fields = ['product_id', 'quantity', 'unit_price', 'discount', 'line_total', 'product']
        read_only_fields = ['line_total', 'product']

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product not found.")
        return value


class SalesOrderSerializer(serializers.ModelSerializer):
    line_items = OrderLineItemSerializer(many=True, read_only=False)

    class Meta:
        model = SalesOrder
        fields = [
            'id', 'order_number', 'customer', 'salesperson', 'order_date', 'status',
            'subtotal', 'vat_total', 'grand_total', 'profit', 'prices_include_vat', 'line_items'
        ]
        read_only_fields = ['subtotal', 'vat_total', 'grand_total', 'profit', 'salesperson', 'order_number']

    def create(self, validated_data):
        line_data = validated_data.pop('line_items', [])
        validated_data['salesperson'] = self.context['request'].user
        # print("Creating Sales Order with data:", validated_data)
        order = SalesOrder.objects.create(**validated_data)
        for item in line_data:
            print(item)
            OrderLineItem.objects.create(sales_order=order, **item)
        order.calculate_totals()
        order.save(update_fields=['subtotal', 'vat_total', 'grand_total', 'profit'])
        return order
    
class PurchaseOrderLineItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = PurchaseOrderLineItem
        fields = ['id', 'product', 'product_id', 'quantity', 'unit_cost',
                  'discount', 'line_total']
        read_only_fields = ['line_total']

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product not found.")
        return value

class PurchaseOrderSerializer(serializers.ModelSerializer):
    line_items = PurchaseOrderLineItemSerializer(many=True, read_only=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'order_number', 'supplier', 'order_date', 'status',
            'subtotal', 'vat_total', 'grand_total', 'prices_include_vat', 'line_items'
        ]
        read_only_fields = ['subtotal', 'vat_total', 'grand_total', 'order_number']

    def create(self, validated_data):
        line_data = validated_data.pop('line_items', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item in line_data:
            PurchaseOrderLineItem.objects.create(purchase_order=po, **item)
        po.calculate_totals()
        po.save(update_fields=['subtotal', 'vat_total', 'grand_total'])

        return po
    

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'amount', 'paid_on', 'mode']

class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    outstanding = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'sales_order', 'invoice_no', 'issue_date', 'due_date',
            'amount_due', 'paid_amount', 'outstanding', 'status', 'payments'
        ]
        read_only_fields = ['paid_amount', 'status', 'invoice_no']

    def create(self, validated_data):
        # Set amount_due from sales order if provided
        if validated_data.get('sales_order') and not validated_data.get('amount_due'):
            validated_data['amount_due'] = validated_data['sales_order'].grand_total
            
        return super().create(validated_data)

    def to_representation(self, instance):
        """Ensure outstanding is always calculated fresh"""
        data = super().to_representation(instance)
        data['outstanding'] = str(instance.outstanding)
        return data
        

class RouteVisitSerializer(serializers.ModelSerializer):
    sales_orders_details = serializers.SerializerMethodField(read_only=True)
    customer_name = serializers.SerializerMethodField(read_only=True)
    route_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RouteVisit
        fields = [
            'id', 'route', 'customer', 'check_in', 'check_out', 'lat', 'lon', 
            'status', 'sales_orders', 'notes', 'sales_orders_details', 
            'customer_name', 'route_name', 'payment_collected', 'payment_amount', 
            'issues_reported', 'visit_duration_minutes'
        ]
        read_only_fields = ['id']

    def get_sales_orders_details(self, obj):
        """Get detailed info about associated sales orders"""
        return [
            {
                'id': so.id,
                'order_number': so.order_number,
                'order_date': so.order_date,
                'grand_total': str(so.grand_total),
                'status': so.status
            }
            for so in obj.sales_orders.all()
        ]

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def get_route_name(self, obj):
        return f"{obj.route.name} ({obj.route.date})" if obj.route else None

    def validate_customer(self, value):
        if not value:
            raise serializers.ValidationError("This field is required.")
        return value

    def validate_sales_orders(self, value):
        """Validate that all sales orders belong to the same customer as the visit"""
        if value and hasattr(self, 'initial_data'):
            customer_id = self.initial_data.get('customer')
            if customer_id:
                for sales_order in value:
                    if str(sales_order.customer.id) != str(customer_id):
                        raise serializers.ValidationError(
                            f"Sales order {sales_order.order_number} belongs to a different customer."
                        )
        return value

    def create(self, validated_data):
        sales_orders = validated_data.pop('sales_orders', [])
        route_visit = RouteVisit.objects.create(**validated_data)
        if sales_orders:
            route_visit.sales_orders.set(sales_orders)
        return route_visit

    def update(self, instance, validated_data):
        sales_orders = validated_data.pop('sales_orders', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if sales_orders is not None:
            instance.sales_orders.set(sales_orders)
        
        return instance


class RouteSerializer(serializers.ModelSerializer):
    visits = RouteVisitSerializer(many=True, read_only=True)
    salesperson_name = serializers.CharField(source='salesperson.email', read_only=True)
    
    class Meta:
        model = Route
        fields = [
            'id', 'route_number', 'salesperson', 'name', 'date',
            'start_time', 'end_time', 'visits', 'salesperson_name'
        ]
        read_only_fields = ['id', 'route_number', 'salesperson_name']

    def get_fields(self):
        fields = super().get_fields()
        # Get request from context
        request = self.context.get('request')
        
        # Make 'salesperson' read-only for non-admin users
        if request and request.user.role != 'admin':
            fields['salesperson'].read_only = True
        return fields

    def create(self, validated_data):
        # For non-admin users, set salesperson to current user
        if self.context['request'].user.role != 'admin':
            validated_data['salesperson'] = self.context['request'].user
        return super().create(validated_data)   


class RouteLocationPingSerializer(serializers.ModelSerializer):
    route = serializers.UUIDField()
    lat = serializers.DecimalField(max_digits=20, decimal_places=15)  # Updated to match model
    lon = serializers.DecimalField(max_digits=20, decimal_places=15)  # Updated to match model
    accuracy_meters = serializers.DecimalField(max_digits=10, decimal_places=6, required=False, allow_null=True)  # Updated to match model
    speed_mps = serializers.DecimalField(max_digits=8, decimal_places=4, required=False, allow_null=True)  # Updated to match model
    heading_degrees = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = RouteLocationPing
        fields = [
            'id', 'route', 'visit', 'lat', 'lon', 'accuracy_meters',
            'speed_mps', 'heading_degrees', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_route(self, value):
        """Validate that the route exists and belongs to the current user if they're a salesperson"""
        try:
            from .models import Route
            route = Route.objects.get(id=value)
            user = self.context['request'].user
            role = getattr(user, 'role', '')
            if role == 'salesperson' and route.salesperson != user:
                raise serializers.ValidationError("You can only send location for your own routes")
            return route
        except Route.DoesNotExist:
            raise serializers.ValidationError("Route not found")

    def validate_lat(self, value):
        """Validate latitude is within valid range"""
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value

    def validate_lon(self, value):
        """Validate longitude is within valid range"""
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value

    def validate_accuracy_meters(self, value):
        """Validate accuracy if provided"""
        if value is not None:
            try:
                acc = float(value)
                if acc < 0:
                    raise serializers.ValidationError("Accuracy cannot be negative")
                # Round to 6 decimal places to match model constraint
                return round(acc, 6)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Accuracy must be a valid number")
        return value

    def validate_speed_mps(self, value):
        """Validate speed if provided"""
        if value is not None:
            try:
                speed = float(value)
                if speed < 0:
                    raise serializers.ValidationError("Speed cannot be negative")
                # Round to 4 decimal places to match model constraint
                return round(speed, 4)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Speed must be a valid number")
        return value

    def validate_heading_degrees(self, value):
        """Validate heading if provided"""
        if value is not None:
            try:
                heading = float(value)
                if heading < 0 or heading > 360:
                    raise serializers.ValidationError("Heading must be between 0 and 360 degrees")
                # Round to 2 decimal places to match model constraint
                return round(heading, 2)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Heading must be a valid number")
        return value

    def validate(self, data):
        """Additional validation"""
        print(f"Validating RouteLocationPing data: {data}")  # Debug print
        return data


# serializers.py
class CustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address', 
                 'credit_limit', 'current_balance', 'order_count', 'total_spent']

    def get_order_count(self, obj):
        
        return obj.sales_orders.count()

    def get_total_spent(self, obj):
        from django.db.models import Sum
        return obj.sales_orders.aggregate(
            total=Sum('grand_total')
        )['total'] or 0