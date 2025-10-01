from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, Company

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'company', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'company', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Custom fields', {'fields': ('role', 'blocked', 'company')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'company'),
        }),
    )
    
    def save_model(self, request, obj, form, change):
        # Ensure password is properly hashed when saving from admin
        if not change:  # New user
            obj.set_password(form.cleaned_data.get('password1') or form.cleaned_data.get('password'))
        elif 'password' in form.changed_data:
            obj.set_password(form.cleaned_data.get('password'))
        super().save_model(request, obj, form, change)

# Register your models here.
admin.site.register(User, CustomUserAdmin)
admin.site.site_header = "Prospello Admin"
admin.site.site_title = "Prospello Admin Portal"
admin.site.index_title = "Welcome to the Prospello Admin Portal"
admin.site.register(Company)