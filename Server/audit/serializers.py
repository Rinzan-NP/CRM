from rest_framework import serializers
from audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    # Add user details instead of just the foreign key
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_email', 'user_role', 'action', 'model_name', 'object_id', 'timestamp', 'changes']
