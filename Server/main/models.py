import uuid
from datetime import datetime, timedelta
from decimal import Decimal

# from Server.transactions.models import Invoice
from accounts.models import Company
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.forms import ValidationError


# Create your models here.
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Credit(BaseModel):
    invoice = models.OneToOneField("transactions.Invoice", on_delete=models.CASCADE, related_name="credits")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expired_at = models.DateTimeField(null=True, blank=True)
    payed_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    @property
    def remaining_amount(self):
        return self.amount - self.payed_amount

    @property
    def status(self):
        from django.utils import timezone
        if self.remaining_amount <= 0:
            return "paid"
        elif self.expired_at and self.expired_at < timezone.now():
            return "expired"
        else:
            return "active"

    def extend_credit(self, additional_days):
        from django.utils import timezone
        if self.expired_at:
            self.expired_at += timedelta(days=additional_days)
        else:
            self.expired_at = timezone.now() + timedelta(days=additional_days)
        self.save()

    def __str__(self):
        return f"Credit of {self.amount} for Invoice {self.invoice.invoice_no}"


# Credit signal removed - credit creation and balance updates are now handled in Invoice and Payment models


class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    credit_expire_days = models.IntegerField(default=30)
    # credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    address = models.TextField(blank=True, null=True)
    company = models.ForeignKey(
        Company, on_delete=models.SET_NULL, blank=True, null=True
    )
    # Enhanced location fields
    lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Latitude coordinate",
    )
    lon = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Longitude coordinate",
    )
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True) 
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    location_verified = models.BooleanField(
        default=False, help_text="Whether GPS coordinates have been verified"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    @property
    def can_order(self):
        from django.utils import timezone
        today = timezone.now()
        return not Credit.objects.filter(
            invoice__sales_order__customer=self, 
            expired_at__lt=today,
            payed_amount__lt=models.F('amount')
        ).exists()

    def __str__(self):
        return self.name

    def get_balance(self):
        """Return customer's outstanding balance (invoices - payments).

        Includes all invoices linked to this customer's sales orders,
        excluding draft and cancelled invoices.
        """
        try:
            from transactions.models import (
                Invoice,
            )  # local import to avoid circular dependency
        except Exception:
            return Decimal("0.00")

        invoices_qs = Invoice.objects.filter(sales_order__customer=self).exclude(
            status__in=["draft", "cancelled"]
        )  # ignore non-actionable invoices

        totals = invoices_qs.aggregate(
            amount_due_total=models.Sum("amount_due"),
            paid_total=models.Sum("paid_amount"),
        )

        amount_due = totals.get("amount_due_total") or Decimal("0.00")
        paid = totals.get("paid_total") or Decimal("0.00")
        return amount_due - paid

    @property
    def has_coordinates(self):
        """Check if customer has GPS coordinates"""
        return self.lat is not None and self.lon is not None

    @property
    def location_display(self):
        """Get formatted location string"""
        parts = []
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.country:
            parts.append(self.country)
        if self.postal_code:
            parts.append(self.postal_code)

        if parts:
            return ", ".join(parts)
        elif self.address:
            return self.address
        else:
            return "Location not specified"

    class Meta:
        unique_together = ("email", "company")


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    company = models.ForeignKey(
        Company, on_delete=models.SET_NULL, blank=True, null=True
    )

    def __str__(self):
        return self.name

    def get_balance(self):
        # Placeholder for balance calculation logic
        return 0.0

    class Meta:
        unique_together = ("email", "company")


class VATSettings(models.Model):
    category = models.CharField(max_length=100)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.category} - {self.rate}%"

    def clean(self):
        super().clean()
        if self.rate < 0:
            raise ValidationError("VAT rate cannot be negative.")
        if not self.category:
            raise ValidationError("VAT category is required.")

    class Meta:
        unique_together = ("category", "company")


class Product(BaseModel):
    code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    vat_category = models.ForeignKey(
        VATSettings, on_delete=models.PROTECT, related_name="products"
    )
    is_active = models.BooleanField(default=True)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.unit_price < 0:
            raise ValidationError("Unit price cannot be negative.")
        if self.unit_cost < 0:
            raise ValidationError("Unit cost cannot be negative.")
        if not self.code:
            raise ValidationError("Product code is required.")

    @property
    def vat_rate(self):
        return self.vat_category.rate

    class Meta:
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["name"]),
        ]
        unique_together = ("code", "company")


