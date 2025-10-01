from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model with formatted data display.
    """
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    formatted_before_data = serializers.ReadOnlyField()
    formatted_after_data = serializers.ReadOnlyField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'model_name', 'record_number', 'action', 
            'performed_by', 'performed_by_username', 'performed_by_email',
            'before_data', 'after_data', 'formatted_before_data', 
            'formatted_after_data', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

