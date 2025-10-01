from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model with formatted data display.
    Cleans up system fields from before_data and after_data.
    """
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    formatted_before_data = serializers.ReadOnlyField()
    formatted_after_data = serializers.ReadOnlyField()
    
    # Fields to exclude from audit data
    SYSTEM_FIELDS = {
        'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
        'company_id', 'company', 'is_active', 'is_deleted', 'deleted_at',
        'last_login', 'date_joined', 'password', 'password_hash',
        'session_key', 'session_data', 'csrf_token'
    }
    
    def clean_audit_data(self, data):
        """
        Remove system fields from audit data to keep only relevant business data.
        """
        if not isinstance(data, dict):
            return data
            
        cleaned_data = {}
        for key, value in data.items():
            # Skip system fields
            if key.lower() in self.SYSTEM_FIELDS:
                continue
            # Skip fields that are None or empty
            if value is None or value == '':
                continue
            # Skip fields that look like system IDs
            if key.endswith('_id') and isinstance(value, (int, str)) and str(value).isdigit():
                continue
            cleaned_data[key] = value
        
        return cleaned_data
    
    def to_representation(self, instance):
        """
        Override to clean up the audit data before sending to frontend.
        """
        data = super().to_representation(instance)
        
        # Clean up before_data
        if data.get('before_data'):
            data['before_data'] = self.clean_audit_data(data['before_data'])
        
        # Clean up after_data
        if data.get('after_data'):
            data['after_data'] = self.clean_audit_data(data['after_data'])
        
        return data
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'model_name', 'record_number', 'action', 
            'performed_by', 'performed_by_username', 'performed_by_email',
            'before_data', 'after_data', 'formatted_before_data', 
            'formatted_after_data', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

