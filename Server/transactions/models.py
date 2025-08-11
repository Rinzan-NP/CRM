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

    class Meta:
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["order_date"]),
        ]

    def __str__(self):
        return f"SO-{self.order_date.strftime('%y%m%d')}-{str(self.id)[:6]}"

    def calculate_totals(self):
        """
        Aggregate line items, compute subtotal, vat_total, grand_total, profit.
        Call this from the save() of OrderLineItem and SalesOrder.
        """
        lines = self.line_items.select_related("product__vat_category")
        subtotal = sum(l.line_total for l in lines)
        vat_total = 0
        total_cost = 0
        for l in lines:
            vat_rate = l.product.vat_category.rate
            vat_total += l.line_total * vat_rate / 100
            # compute cost using product.unit_cost
            total_cost += (getattr(l.product, "unit_cost", 0) or 0) * l.quantity
        self.subtotal = subtotal
        self.vat_total = vat_total
        self.grand_total = subtotal + vat_total
        # profit = revenue - cost
        self.profit = subtotal - total_cost


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
    supplier = models.ForeignKey(
        "main.Supplier", on_delete=models.CASCADE, related_name="purchase_orders"
    )
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vat_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        indexes = [
            models.Index(fields=["supplier", "status"]),
            models.Index(fields=["order_date"]),
        ]

    def __str__(self):
        return f"PO-{self.order_date.strftime('%y%m%d')}-{str(self.id)[:6]}"

    def calculate_totals(self):
        lines = self.line_items.select_related("product__vat_category")
        subtotal = sum(l.line_total for l in lines)
        vat_total = 0
        for l in lines:
            vat_total += l.line_total * l.product.vat_category.rate / 100
        self.subtotal = subtotal
        self.vat_total = vat_total
        self.grand_total = subtotal + vat_total


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
    invoice_no  = models.CharField(max_length=50, unique=True)
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
        return max(self.amount_due - self.paid_amount, 0)

    def mark_paid(self, amount):
        self.paid_amount += amount
        if self.paid_amount >= self.amount_due:
            self.status = "paid"
        self.save(update_fields=["paid_amount", "status"])
        
    def save(self, *args, **kwargs):
        # Generate invoice number if not provided
        if not self.invoice_no:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            # Use a temporary ID if not saved yet
            temp_id = str(self.id) if self.id else 'TEMP'
            self.invoice_no = f"INV-{timestamp}-{temp_id[:6]}"
        
        # Set amount_due from sales order if not set
        if not self.amount_due and self.sales_order:
            self.amount_due = self.sales_order.grand_total
            
        super().save(*args, **kwargs)
        
        # Update invoice number with actual ID if it was temporary
        if self.invoice_no and 'TEMP' in self.invoice_no:
            self.invoice_no = self.invoice_no.replace('TEMP', str(self.id)[:6])
            super().save(update_fields=['invoice_no'])


class Payment(BaseModel):
    invoice = models.ForeignKey(Invoice, related_name="payments", on_delete=models.CASCADE)
    amount  = models.DecimalField(max_digits=12, decimal_places=2)
    paid_on = models.DateField()
    mode    = models.CharField(max_length=30, choices=[("cash", "Cash"), ("bank", "Bank")])

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.mark_paid(self.amount)
        
        
class Route(BaseModel):
    salesperson = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name        = models.CharField(max_length=100)
    date        = models.DateField()
    start_time  = models.TimeField(null=True, blank=True)
    end_time    = models.TimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["salesperson", "date"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"


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
    status    = models.CharField(max_length=10, choices=STATUS_CHOICES, default="planned")


class RouteLocationPing(BaseModel):
    """Live GPS pings during a route visit"""
    route = models.ForeignKey(Route, related_name="location_pings", on_delete=models.CASCADE)
    visit = models.ForeignKey(RouteVisit, related_name="location_pings", on_delete=models.SET_NULL, null=True, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6)
    lon = models.DecimalField(max_digits=9, decimal_places=6)
    accuracy_meters = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    speed_mps = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    heading_degrees = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["route", "created_at"]),
        ]