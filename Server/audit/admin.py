from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'model_name', 'record_number', 'action', 
        'performed_by', 'timestamp', 'data_preview'
    ]
    list_filter = [
        'model_name', 'action', 'performed_by', 'timestamp'
    ]
    search_fields = [
        'model_name', 'record_number', 'performed_by__username', 
        'performed_by__email'
    ]
    readonly_fields = [
        'id', 'model_name', 'record_number', 'action', 
        'performed_by', 'timestamp', 'formatted_before_data', 
        'formatted_after_data'
    ]
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'model_name', 'record_number', 'action', 'performed_by', 'timestamp')
        }),
        ('Data Changes', {
            'fields': ('formatted_before_data', 'formatted_after_data'),
            'classes': ('collapse',)
        }),
    )
    
    def data_preview(self, obj):
        """Show a preview of the data changes"""
        if obj.before_data and obj.after_data:
            return "Before/After Data Available"
        elif obj.after_data:
            return "After Data Available"
        elif obj.before_data:
            return "Before Data Available"
        return "No Data"
    data_preview.short_description = "Data Preview"
    
    def formatted_before_data(self, obj):
        """Display formatted before data"""
        if obj.before_data:
            return format_html(
                '<pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">{}</pre>',
                obj.formatted_before_data
            )
        return "N/A"
    formatted_before_data.short_description = "Before Data"
    
    def formatted_after_data(self, obj):
        """Display formatted after data"""
        if obj.after_data:
            return format_html(
                '<pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">{}</pre>',
                obj.formatted_after_data
            )
        return "N/A"
    formatted_after_data.short_description = "After Data"
    
    def has_add_permission(self, request):
        """Prevent manual creation of audit logs"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent modification of audit logs"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of audit logs (for audit integrity)"""
        return False
    
    class Media:
        css = {
            'all': ('admin/css/audit_admin.css',)
        }
