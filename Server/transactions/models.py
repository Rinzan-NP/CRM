from decimal import Decimal
from django.db import models

# Create your models here.
# transactions/models.py
from django.db import models
from django.conf import settings
from main.models import BaseModel, Customer, Product, VATSettings


class SalesOrder(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
        ("invoiced", "Invoiced"),
        ("cancelled", "Cancelled"),
    ]
    # Human-readable ID for display
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="sales_orders"
    )
    salesperson = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vat_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    # When true, unit prices entered on line items are VAT-inclusive (gross)
    prices_include_vat = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["order_date"]),
        ]

    def __str__(self):
        return self.order_number or f"SO-{self.order_date.strftime('%y%m%d')}-{str(self.id)[:6]}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d')
            # Ensure unique order_number for the day
            today_orders = SalesOrder.objects.filter(
                order_date=self.order_date
            ).count()
            base_order_number = f"SO-{timestamp}-{today_orders + 1:03d}"
            # Check for duplicates and increment if needed
            order_number = base_order_number
            counter = today_orders + 1
            while SalesOrder.objects.filter(order_number=order_number).exists():
                counter += 1
                order_number = f"SO-{timestamp}-{counter:03d}"
            self.order_number = order_number
        super().save(*args, **kwargs)

    def calculate_totals(self):
        """
        Aggregate line items, compute subtotal, vat_total, grand_total, profit.
        Call this from the save() of OrderLineItem and SalesOrder.
        """
        lines = self.line_items.select_related("product__vat_category")
        net_subtotal = 0
        vat_total = 0
        total_cost = 0
        for l in lines:
            vat_rate = float(l.product.vat_category.rate or 0)
            line_gross = float(l.line_total)
            if self.prices_include_vat and vat_rate > 0:
                # gross includes VAT → net = gross / (1 + r)
                net = line_gross / (1 + vat_rate / 100)
                vat = line_gross - net
            else:
                # exclusive or zero/exempt
                net = line_gross
                vat = line_gross * vat_rate / 100
            net_subtotal += net
            vat_total += vat
            # compute cost using product.unit_cost
            total_cost += float(getattr(l.product, "unit_cost", 0) or 0) * float(l.quantity)
        self.subtotal = net_subtotal
        self.vat_total = vat_total
        self.grand_total = net_subtotal + vat_total
        # profit = revenue(net) - cost
        self.profit = net_subtotal - total_cost


class OrderLineItem(BaseModel):
    sales_order = models.ForeignKey(
        SalesOrder, related_name="line_items", on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    class Meta:
        unique_together = ("sales_order", "product")
        indexes = [models.Index(fields=["sales_order", "product"])]

    def save(self, *args, **kwargs):
        self.line_total = (self.unit_price * self.quantity) * (1 - self.discount / 100)
        super().save(*args, **kwargs)
        # trigger parent totals
        self.sales_order.calculate_totals()
        self.sales_order.save(
            update_fields=["subtotal", "vat_total", "grand_total", "profit"]
        )


class PurchaseOrder(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
        ("received", "Received"),
        ("cancelled", "Cancelled"),
    ]
    # Human-readable ID for display
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    supplier = models.ForeignKey(
        "main.Supplier", on_delete=models.CASCADE, related_name="purchase_orders"
    )
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vat_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    # When true, unit costs entered on line items are VAT-inclusive (gross)
    prices_include_vat = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["supplier", "status"]),
            models.Index(fields=["order_date"]),
        ]

    def __str__(self):
        return self.order_number or f"PO-{self.order_date.strftime('%y%m%d')}-{str(self.id)[:6]}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d')
            # Ensure unique order_number for the day
            today_orders = PurchaseOrder.objects.filter(
                order_date=self.order_date
            ).count()
            base_order_number = f"PO-{timestamp}-{today_orders + 1:03d}"
            # Check for duplicates and increment if needed
            order_number = base_order_number
            counter = today_orders + 1
            while PurchaseOrder.objects.filter(order_number=order_number).exists():
                counter += 1
                order_number = f"PO-{timestamp}-{counter:03d}"
            self.order_number = order_number
        super().save(*args, **kwargs)

    def calculate_totals(self):
        lines = self.line_items.select_related("product__vat_category")
        net_subtotal = 0
        vat_total = 0
        for l in lines:
            vat_rate = float(l.product.vat_category.rate or 0)
            line_gross = float(l.line_total)
            if self.prices_include_vat and vat_rate > 0:
                net = line_gross / (1 + vat_rate / 100)
                vat = line_gross - net
            else:
                net = line_gross
                vat = line_gross * vat_rate / 100
            net_subtotal += net
            vat_total += vat
        self.subtotal = net_subtotal
        self.vat_total = vat_total
        self.grand_total = net_subtotal + vat_total


class PurchaseOrderLineItem(BaseModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder, related_name="line_items", on_delete=models.CASCADE
    )
    product = models.ForeignKey("main.Product", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    class Meta:
        unique_together = ("purchase_order", "product")
        indexes = [models.Index(fields=["purchase_order", "product"])]

    def save(self, *args, **kwargs):
        self.line_total = (self.unit_cost * self.quantity) * (1 - self.discount / 100)
        super().save(*args, **kwargs)
        self.purchase_order.calculate_totals()
        self.purchase_order.save(update_fields=["subtotal", "vat_total", "grand_total"])


class Invoice(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
    ]
    sales_order = models.OneToOneField(SalesOrder, on_delete=models.CASCADE, related_name="invoice")
    invoice_no  = models.CharField(max_length=50, unique=True, blank=True)
    issue_date  = models.DateField()
    due_date    = models.DateField()
    amount_due  = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # = SO.grand_total
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    class Meta:
        indexes = [
            models.Index(fields=["invoice_no"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return self.invoice_no

    @property
    def outstanding(self):
        """Calculate outstanding amount"""
        return max(self.amount_due - self.paid_amount, Decimal('0.00'))

    def update_payment_status(self):
        """Update paid_amount and status based on all payments"""
        total_paid = self.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.paid_amount = total_paid
        
        if self.paid_amount >= self.amount_due:
            self.status = "paid"
        elif self.paid_amount > 0:
            self.status = "sent"  # Partially paid
        
        self.save(update_fields=['paid_amount', 'status'])
        
    def save(self, *args, **kwargs):
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        # Always ensure invoice_no is unique
        if not self.invoice_no or Invoice.objects.filter(invoice_no=self.invoice_no).exclude(pk=self.pk).exists():
            counter = 1
            while True:
                candidate = f"INV-{timestamp}-{counter:03d}"
                if not Invoice.objects.filter(invoice_no=candidate).exists():
                    self.invoice_no = candidate
                    break
                counter += 1
        # Set amount_due from sales order if not set
        if not self.amount_due and self.sales_order:
            self.amount_due = self.sales_order.grand_total
        super().save(*args, **kwargs)


class Payment(BaseModel):
    invoice = models.ForeignKey(Invoice, related_name="payments", on_delete=models.CASCADE)
    amount  = models.DecimalField(max_digits=12, decimal_places=2)
    paid_on = models.DateField()
    mode    = models.CharField(max_length=30, choices=[("cash", "Cash"), ("bank", "Bank")])

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Only update invoice status after saving the payment
        if is_new:  # Only for new payments, not updates
            self.invoice.update_payment_status()
    
    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)
        # Update invoice status after deleting payment
        invoice.update_payment_status()
        
        
class Route(BaseModel):
    # Human-readable ID for display
    route_number = models.CharField(max_length=20, unique=True, blank=True)
    salesperson = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name        = models.CharField(max_length=100)
    date        = models.DateField()
    start_time  = models.TimeField(null=True, blank=True)
    end_time    = models.TimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["route_number"]),
            models.Index(fields=["salesperson", "date"]),
        ]

    def __str__(self):
        return self.route_number or f"{self.name} - {self.date}"

    def save(self, *args, **kwargs):
        if not self.route_number:
            # Generate route number if not provided
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d')
            # Get count of routes for today
            today_routes = Route.objects.filter(
                date=self.date
            ).count()
            self.route_number = f"RT-{timestamp}-{today_routes + 1:03d}"
        super().save(*args, **kwargs)


class RouteVisit(BaseModel):
    STATUS_CHOICES = [
        ("planned", "Planned"),
        ("visited", "Visited"),
        ("missed", "Missed"),
    ]
    route     = models.ForeignKey(Route, related_name="visits", on_delete=models.CASCADE)
    customer  = models.ForeignKey("main.Customer", on_delete=models.CASCADE)
    check_in  = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    lat       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lon       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    sales_orders = models.ManyToManyField('SalesOrder', blank=True, related_name='route_visits')
    status    = models.CharField(max_length=10, choices=STATUS_CHOICES, default="planned")
    notes     = models.TextField(blank=True)


class RouteLocationPing(BaseModel):
    """Live GPS pings during a route visit"""
    route = models.ForeignKey(Route, related_name="location_pings", on_delete=models.CASCADE)
    visit = models.ForeignKey(RouteVisit, related_name="location_pings", on_delete=models.SET_NULL, null=True, blank=True)
    lat = models.DecimalField(max_digits=20, decimal_places=15)  # Increased to handle high-precision GPS coordinates
    lon = models.DecimalField(max_digits=20, decimal_places=15)  # Increased to handle high-precision GPS coordinates
    accuracy_meters = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)  # Increased precision for GPS accuracy
    speed_mps = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)  # Increased precision for speed
    heading_degrees = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["route", "created_at"]),
        ]