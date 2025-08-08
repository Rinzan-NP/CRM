from django.contrib import admin

# Register your models here.
from .models import Product, Supplier, VATSettings,Customer
admin.site.register(Product)
admin.site.register(Supplier)   
admin.site.register(VATSettings)
admin.site.register(Customer)   