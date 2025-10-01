from decimal import Decimal
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Create your models here.
# transactions/models.py
from django.db import models
from django.conf import settings
from main.models import BaseModel, Credit, Customer, Product, VATSettings,Company
from accounts.models import User


class SalesOrder(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
        ("invoiced", "Invoiced"),
        ("cancelled", "Cancelled"),
    ]
    # Human-readable ID for display
    order_number = models.CharField(max_length=20, blank=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="sales_orders"
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sales_orders')
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vat_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    # When true, unit prices entered on line items are VAT-inclusive (gross)
    prices_include_vat = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sales_orders')
    gone_for_delivery = models.BooleanField(default=False)
    class Meta:
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["order_date"]),
        ]
        unique_together = ("order_number", "company")

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
        self.product.stock = models.F('stock') - self.quantity
        self.product.save(update_fields=['stock'])
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
    order_number = models.CharField(max_length=20, blank=True)
    supplier = models.ForeignKey(
        "main.Supplier", on_delete=models.CASCADE, related_name="purchase_orders"
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='purchase_orders')
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
        unique_together = ("order_number", "company")

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
        self.product.stock += self.quantity
        self.product.save(update_fields=['stock'])
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
    invoice_no  = models.CharField(max_length=50, blank=True)
    issue_date  = models.DateField()
    due_date    = models.DateField(help_text="Due date from frontend - used as credit expiry date")
    amount_due  = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # = SO.grand_total
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    company     = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invoices')
    class Meta:
        indexes = [
            models.Index(fields=["invoice_no"]),
            models.Index(fields=["due_date"]),
        ]
        unique_together = ("invoice_no", "company")

    def __str__(self):
        return self.invoice_no

    @property
    def outstanding(self):
        """Calculate outstanding amount considering credit system"""
        try:
            credit = self.credits
            # If credit exists, outstanding amount is the credit's remaining amount
            credit_amount = Decimal(str(credit.amount))
            paid_amount = Decimal(str(credit.payed_amount or 0))
            return max(credit_amount - paid_amount, Decimal('0.00'))
        except Credit.DoesNotExist:
            # No credit, use traditional invoice payment logic
            return max(Decimal(self.amount_due) - Decimal(self.paid_amount), Decimal('0.00'))

    def update_payment_status(self):
        """Update paid_amount and status based on credit system"""
        # Force refresh from database to get latest data
        self.refresh_from_db()
        
        try:
            credit = self.credits
            # Use credit system for status calculation
            credit_amount = Decimal(str(credit.amount))
            paid_amount = Decimal(str(credit.payed_amount or 0))
            credit_remaining = credit_amount - paid_amount
            
            if credit_remaining <= 0:
                self.status = "paid"
                self.paid_amount = self.amount_due  # Full amount is considered paid
            elif paid_amount > 0:
                self.status = "sent"  # Partially paid through credit
                self.paid_amount = paid_amount
            else:
                self.status = "sent"  # Credit granted but no payments yet
                self.paid_amount = Decimal('0.00')
                
        except Credit.DoesNotExist:
            # No credit system - use traditional payment logic
            total_paid = self.payments.aggregate(
                total=models.Sum('amount')
            )['total'] or Decimal('0.00')
            
            total_paid = Decimal(str(total_paid))
            amount_due = Decimal(str(self.amount_due))
            
            self.paid_amount = total_paid
            
            if total_paid >= amount_due:
                self.status = "paid"
            elif total_paid > 0:
                self.status = "sent"
            else:
                self.status = "draft"
        
        # Save the updated invoice
        self.save(update_fields=['paid_amount', 'status'])
        
        # Debug logging
        print(f"Invoice {self.invoice_no}: amount_due={self.amount_due}, paid_amount={self.paid_amount}, status={self.status}")
        
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
            
        # Create credit when invoice is generated (customer gets credit)
        super().save(*args, **kwargs)
        
        # Create credit for the customer when invoice is generated
        # Import Credit model first
        from main.models import Credit
        
        # Check if credit already exists for this invoice
        try:
            existing_credit = self.credits
        except Credit.DoesNotExist:
            existing_credit = None
            
        if existing_credit is None:
            customer = self.sales_order.customer
            
            # Use due_date as credit expiry date, or fallback to customer's default
            if self.due_date:
                from django.utils import timezone
                from datetime import datetime, time
                # Convert due_date to datetime with end of day
                expiry_date = timezone.make_aware(
                    datetime.combine(self.due_date, time.max)
                )
            else:
                from django.utils import timezone
                from datetime import timedelta
                expiry_date = timezone.now() + timedelta(days=customer.credit_expire_days)
            
            Credit.objects.create(
                invoice=self,
                amount=self.amount_due,
                expired_at=expiry_date
            )


class Payment(BaseModel):
    invoice = models.ForeignKey(Invoice, related_name="payments", on_delete=models.CASCADE)
    amount  = models.DecimalField(max_digits=12, decimal_places=2)
    paid_on = models.DateField(auto_now=True)
    mode    = models.CharField(max_length=30, choices=[("cash", "Cash"), ("bank", "Bank")])
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='payments')

                
        
class Route(BaseModel):
    # Human-readable ID for display
    route_number = models.CharField(max_length=20, unique=True, blank=True)
    salesperson = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name        = models.CharField(max_length=100)
    date        = models.DateField()
    start_time  = models.TimeField(null=True, blank=True)
    end_time    = models.TimeField(null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='routes')

    class Meta:
        indexes = [
            models.Index(fields=["route_number"]),
            models.Index(fields=["salesperson", "date"]),
        ]

    def __str__(self):
        return self.route_number or f"{self.name} - {self.date}"

    def save(self, *args, **kwargs):
        if not self.route_number:
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
    # Enhanced visit logging fields
    payment_collected = models.BooleanField(default=False)
    payment_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    issues_reported = models.TextField(blank=True)
    visit_duration_minutes = models.IntegerField(null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='route_visits')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # After saving, update all associated sales orders to gone_for_delivery = True
        for sales_order in self.sales_orders.all():
            sales_order.gone_for_delivery = True
            sales_order.save(update_fields=['gone_for_delivery'])

class RouteLocationPing(BaseModel):
    """Live GPS pings during a route visit"""
    route = models.ForeignKey(Route, related_name="location_pings", on_delete=models.CASCADE)
    visit = models.ForeignKey(RouteVisit, related_name="location_pings", on_delete=models.SET_NULL, null=True, blank=True)
    lat = models.DecimalField(max_digits=20, decimal_places=15)  # Increased to handle high-precision GPS coordinates
    lon = models.DecimalField(max_digits=20, decimal_places=15)  # Increased to handle high-precision GPS coordinates
    accuracy_meters = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    speed_mps = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)  # Increased precision for speed
    heading_degrees = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='route_location_pings')

    class Meta:
        indexes = [
            models.Index(fields=["route", "created_at"]),
        ]


# Signal handlers for Payment model
@receiver(post_save, sender=Payment)
def update_credit_on_payment_save(sender, instance, created, **kwargs):
    """Update credit when payment is created or updated"""
    print(f"DEBUG: Payment signal triggered - created: {created}, amount: {instance.amount}")
    
    try:
        credit = instance.invoice.credits
        print(f"DEBUG: Found credit with current payed_amount: {credit.payed_amount}")
        
        if created:
            # New payment - add to payed_amount
            current_payed = credit.payed_amount or 0
            credit.payed_amount = current_payed + instance.amount
            print(f"DEBUG: Added {instance.amount} to payed_amount: {current_payed} -> {credit.payed_amount}")
        else:
            # Updated payment - recalculate total from all payments
            total_payments = instance.invoice.payments.aggregate(
                total=models.Sum('amount')
            )['total'] or 0
            credit.payed_amount = total_payments
            print(f"DEBUG: Recalculated payed_amount from all payments: {credit.payed_amount}")
        
        credit.save()
        print(f"DEBUG: Credit updated successfully")
        
        # Update invoice status
        instance.invoice.update_payment_status()
        
    except Credit.DoesNotExist:
        print(f"DEBUG: No credit found for invoice {instance.invoice.invoice_no}")
        # Create credit if it doesn't exist
        from django.utils import timezone
        from datetime import timedelta
        customer = instance.invoice.sales_order.customer
        expiry_date = timezone.now() + timedelta(days=customer.credit_expire_days)
        
        Credit.objects.create(
            invoice=instance.invoice,
            amount=instance.invoice.amount_due,
            expired_at=expiry_date,
            payed_amount=instance.amount
        )
        print(f"DEBUG: Created new credit with payed_amount: {instance.amount}")


@receiver(post_delete, sender=Payment)
def update_credit_on_payment_delete(sender, instance, **kwargs):
    """Update credit when payment is deleted"""
    print(f"DEBUG: Payment delete signal triggered for amount: {instance.amount}")
    
    try:
        credit = instance.invoice.credits
        # Recalculate total from remaining payments
        total_payments = instance.invoice.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        credit.payed_amount = total_payments
        credit.save()
        print(f"DEBUG: Credit updated after payment deletion: {credit.payed_amount}")
        
        # Update invoice status
        instance.invoice.update_payment_status()
        
    except Credit.DoesNotExist:
        print(f"DEBUG: No credit found for deleted payment")