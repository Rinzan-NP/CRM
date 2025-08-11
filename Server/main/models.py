from django.db import models
import uuid

from django.forms import ValidationError

# Create your models here.
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name
    
    def get_balance(self):
        # Placeholder for balance calculation logic
        return 0.0

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name
    
    def get_balance(self):
        # Placeholder for balance calculation logic
        return 0.0
    
        
class VATSettings(models.Model):
    category = models.CharField(max_length=100, unique=True)
    rate = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"{self.category} - {self.rate}%"
    
    def clean(self):
        super().clean()
        if self.rate < 0:
            raise ValidationError('VAT rate cannot be negative.')
        if not self.category:
            raise ValidationError('VAT category is required.')


class Product(BaseModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    vat_category = models.ForeignKey(
    VATSettings,
    on_delete=models.PROTECT,
    related_name='products'
)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
    
    def clean(self):
        super().clean()
        if self.unit_price < 0:
            raise ValidationError('Unit price cannot be negative.')
        if self.unit_cost < 0:
            raise ValidationError('Unit cost cannot be negative.')
        if not self.code:
            raise ValidationError('Product code is required.')
        
    @property
    def vat_rate(self):
        return self.vat_category.rate
        
    class Meta:
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
        ]