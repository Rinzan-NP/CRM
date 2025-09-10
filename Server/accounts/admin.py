from django.contrib import admin
from .models import User,Company
# Register your models here.
admin.site.register(User)
admin.site.site_header = "Prospello Admin"
admin.site.site_title = "Prospello Admin Portal"
admin.site.index_title = "Welcome to the Prospello Admin Portal"
admin.site.register(Company)