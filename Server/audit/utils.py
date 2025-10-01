from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import AuditLog
import json
import uuid
from decimal import Decimal
from datetime import date, datetime

User = get_user_model()


class AuditJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder for audit logs that handles non-serializable objects.
    """
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif hasattr(obj, 'pk'):  # Django model instances
            return str(obj)
        elif hasattr(obj, 'isoformat'):  # DateTime objects
            return obj.isoformat()
        return super().default(obj)


def create_audit_log(
    model: str,
    action: str,
    by=None,
    number: str = None,
    before_data: dict = None,
    after_data: dict = None,
    timestamp=None
):
    """
    Create an audit log entry for tracking changes across the system.
    
    Args:
        model (str): Name of the model being audited (e.g., "Customer", "Invoice")
        action (str): Action performed ("create", "update", "delete", "block", "unblock", "read")
        by: User performing the action (from request.user or None for system actions)
        number (str, optional): Record identifier (e.g., "INV-1001", "SO-2001", "PO-3001")
        before_data (dict, optional): Data before the change (for updates)
        after_data (dict, optional): Data after the change
        timestamp: When the action was performed (defaults to timezone.now())
    
    Returns:
        AuditLog: The created audit log instance
        
    Example:
        create_audit_log(
            model="Customer",
            number=customer.customer_code,
            action="update",
            by=request.user,
            before_data={"name": "Old Name", "email": "old@email.com"},
            after_data={"name": "New Name", "email": "new@email.com"}
        )
    """
    
    # Validate action
    valid_actions = ['create', 'update', 'delete', 'block', 'unblock', 'read']
    if action not in valid_actions:
        raise ValueError(f"Invalid action '{action}'. Must be one of: {valid_actions}")
    
    # Handle user parameter
    performed_by = None
    if by is not None:
        if hasattr(by, 'pk'):  # It's a User instance
            performed_by = by
        elif isinstance(by, (int, str)):  # It's a user ID
            try:
                performed_by = User.objects.get(pk=by)
            except User.DoesNotExist:
                performed_by = None
        elif by == 'system' or by is None:
            performed_by = None
        else:
            raise ValueError("Invalid 'by' parameter. Must be a User instance, user ID, 'system', or None")
    
    # Use current timestamp if not provided
    if timestamp is None:
        timestamp = timezone.now()
    
    # Serialize data using custom encoder to handle UUIDs and other non-serializable objects
    serialized_before_data = None
    serialized_after_data = None
    
    if before_data is not None:
        try:
            serialized_before_data = json.loads(json.dumps(before_data, cls=AuditJSONEncoder))
        except (TypeError, ValueError):
            serialized_before_data = {"error": "Failed to serialize before_data"}
    
    if after_data is not None:
        try:
            serialized_after_data = json.loads(json.dumps(after_data, cls=AuditJSONEncoder))
        except (TypeError, ValueError):
            serialized_after_data = {"error": "Failed to serialize after_data"}
    
    # Create the audit log entry
    audit_log = AuditLog.objects.create(
        model_name=model,
        record_number=number,
        action=action,
        performed_by=performed_by,
        before_data=serialized_before_data,
        after_data=serialized_after_data,
        timestamp=timestamp
    )
    
    return audit_log


def get_model_data(instance, fields=None):
    """
    Extract data from a model instance for audit logging.
    Excludes system fields to keep only relevant business data.
    
    Args:
        instance: Model instance to extract data from
        fields (list, optional): Specific fields to extract. If None, extracts all fields.
    
    Returns:
        dict: Dictionary containing the field data
    """
    if instance is None:
        return None
    
    # System fields to exclude from audit data
    SYSTEM_FIELDS = {
        'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
        'company_id', 'company', 'is_active', 'is_deleted', 'deleted_at',
        'last_login', 'date_joined', 'password', 'password_hash',
        'session_key', 'session_data', 'csrf_token'
    }
    
    data = {}
    
    if fields is None:
        # Get all fields from the model, excluding system fields
        all_fields = [field.name for field in instance._meta.fields]
        fields = [field for field in all_fields if field.lower() not in SYSTEM_FIELDS]
    
    for field_name in fields:
        # Skip system fields
        if field_name.lower() in SYSTEM_FIELDS:
            continue
            
        # Skip fields that look like system IDs
        if field_name.endswith('_id') and field_name != 'customer_id':  # Allow business IDs
            continue
            
        if hasattr(instance, field_name):
            value = getattr(instance, field_name)
            
            # Skip None or empty values
            if value is None or value == '':
                continue
            
            # Handle special field types
            if isinstance(value, uuid.UUID):
                data[field_name] = str(value)
            elif isinstance(value, Decimal):
                data[field_name] = float(value)
            elif isinstance(value, (date, datetime)):
                data[field_name] = value.isoformat()
            elif hasattr(value, 'pk'):  # Foreign key or related object
                data[field_name] = str(value)
            elif hasattr(value, 'isoformat'):  # DateTime field
                data[field_name] = value.isoformat()
            else:
                # For other types, try to convert to string if not JSON serializable
                try:
                    json.dumps(value)
                    data[field_name] = value
                except (TypeError, ValueError):
                    data[field_name] = str(value)
    
    return data


def create_audit_log_for_model_change(
    instance,
    action: str,
    by=None,
    before_instance=None,
    fields=None
):
    """
    Convenience function to create audit logs for model changes.
    
    Args:
        instance: The model instance being changed
        action (str): Action performed
        by: User performing the action
        before_instance: Previous state of the instance (for updates)
        fields (list, optional): Specific fields to track
    
    Returns:
        AuditLog: The created audit log instance
    """
    model_name = instance.__class__.__name__
    
    # Try to get a record number/identifier
    number = None
    if hasattr(instance, 'invoice_no'):
        number = instance.invoice_no
    elif hasattr(instance, 'order_no'):
        number = instance.order_no
    elif hasattr(instance, 'customer_code'):
        number = instance.customer_code
    elif hasattr(instance, 'code'):
        number = instance.code
    elif hasattr(instance, 'id'):
        number = str(instance.id)
    
    before_data = None
    after_data = None
    
    if action == 'update' and before_instance:
        before_data = get_model_data(before_instance, fields)
        after_data = get_model_data(instance, fields)
    elif action in ['create', 'delete']:
        after_data = get_model_data(instance, fields)
    
    return create_audit_log(
        model=model_name,
        action=action,
        by=by,
        number=number,
        before_data=before_data,
        after_data=after_data
    )

