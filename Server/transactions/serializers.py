from rest_framework import serializers
from .models import Invoice, Payment, PurchaseOrder, PurchaseOrderLineItem, Route, RouteVisit, SalesOrder, OrderLineItem, RouteLocationPing
from main.models import Product
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

    class Meta:
        model = Invoice
        fields = [
            'id', 'sales_order', 'invoice_no', 'issue_date', 'due_date',
            'amount_due', 'paid_amount', 'outstanding', 'status', 'payments'
        ]
        read_only_fields = ['amount_due', 'paid_amount', 'outstanding', 'status', 'invoice_no']

    def create(self, validated_data):
        # Generate invoice number if not provided
        if not validated_data.get('invoice_no'):
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d')
            validated_data['invoice_no'] = f"INV-{timestamp}"
        
        # Set amount_due from sales order
        if validated_data.get('sales_order') and not validated_data.get('amount_due'):
            validated_data['amount_due'] = validated_data['sales_order'].grand_total
            
        return super().create(validated_data)
        

class RouteVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteVisit
        fields = [
            'id', 'route', 'customer', 'check_in', 'check_out', 'lat', 'lon', 'status'
        ]
        read_only_fields = ['id']

    def validate_customer(self, value):
        if not value:
            raise serializers.ValidationError("This field is required.")
        return value


class RouteSerializer(serializers.ModelSerializer):
    visits = RouteVisitSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'route_number', 'salesperson', 'name', 'date',
            'start_time', 'end_time', 'visits'
        ]
        read_only_fields = ['id', 'route_number', 'salesperson']
        
    def create(self, validated_data):
        validated_data['salesperson'] = self.context['request'].user
        return super().create(validated_data)


class RouteLocationPingSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteLocationPing
        fields = [
            'id', 'route', 'visit', 'lat', 'lon', 'accuracy_meters',
            'speed_mps', 'heading_degrees', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']