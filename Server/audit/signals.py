from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .utils import create_audit_log, get_model_data
from .middleware import get_current_user, set_current_user
import json

User = get_user_model()

# Models to audit - add more models as needed
AUDITABLE_MODELS = [
    'Customer',
    'Supplier', 
    'Product',
    'SalesOrder',
    'Invoice',
    'Payment',
    'Route',
    'RouteVisit',
    'User',
    'Credit'
]

def should_audit_model(model_name):
    """Check if a model should be audited"""
    return model_name in AUDITABLE_MODELS

def get_record_identifier(instance):
    """Get a meaningful identifier for the record"""
    if hasattr(instance, 'invoice_no'):
        return instance.invoice_no
    elif hasattr(instance, 'order_no'):
        return instance.order_no
    elif hasattr(instance, 'customer_code'):
        return instance.customer_code
    elif hasattr(instance, 'supplier_code'):
        return instance.supplier_code
    elif hasattr(instance, 'code'):
        return instance.code
    elif hasattr(instance, 'username'):
        return instance.username
    elif hasattr(instance, 'email'):
        return instance.email
    elif hasattr(instance, 'id'):
        return str(instance.id)
    return None

# Store original data for comparison
_original_data = {}

@receiver(pre_save)
def audit_pre_save(sender, instance, **kwargs):
    """Store original data before save for update comparison"""
    if should_audit_model(sender.__name__):
        try:
            # Get the original instance from database if it exists
            if instance.pk:
                try:
                    original = sender.objects.get(pk=instance.pk)
                    _original_data[instance.pk] = get_model_data(original)
                except sender.DoesNotExist:
                    pass
        except Exception as e:
            print(f"Error in audit_pre_save for {sender.__name__}: {e}")

@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    """Create audit log entry when a model is saved"""
    if not should_audit_model(sender.__name__):
        return
    
    try:
        # Get current user from middleware
        current_user = get_current_user()
        
        # Determine action
        action = 'create' if created else 'update'
        
        # Debug logging to ensure user is captured
        if current_user:
            print(f"Audit: Captured user {current_user.username} for {sender.__name__} {action}")
        else:
            print(f"Audit: No user captured for {sender.__name__} {action} - using System")
        
        # Get record identifier
        record_number = get_record_identifier(instance)
        
        # Prepare data
        before_data = None
        after_data = get_model_data(instance)
        
        # For updates, get the before data
        if not created and instance.pk in _original_data:
            before_data = _original_data[instance.pk]
            # Clean up the stored data
            del _original_data[instance.pk]
        
        # Create audit log
        create_audit_log(
            model=sender.__name__,
            action=action,
            by=current_user,
            number=record_number,
            before_data=before_data,
            after_data=after_data
        )
        
    except Exception as e:
        print(f"Error creating audit log for {sender.__name__} {action}: {e}")

@receiver(post_delete)
def audit_post_delete(sender, instance, **kwargs):
    """Create audit log entry when a model is deleted"""
    if not should_audit_model(sender.__name__):
        return
    
    try:
        # Get current user from middleware
        current_user = get_current_user()
        
        # Debug logging to ensure user is captured
        if current_user:
            print(f"Audit: Captured user {current_user.username} for {sender.__name__} delete")
        else:
            print(f"Audit: No user captured for {sender.__name__} delete - using System")
        
        # Get record identifier
        record_number = get_record_identifier(instance)
        
        # Get the data before deletion
        before_data = get_model_data(instance)
        
        # Create audit log
        create_audit_log(
            model=sender.__name__,
            action='delete',
            by=current_user,
            number=record_number,
            before_data=before_data,
            after_data=None
        )
        
    except Exception as e:
        print(f"Error creating audit log for {sender.__name__} delete: {e}")

# Special signal for user login/logout
@receiver(post_save, sender=User)
def audit_user_login(sender, instance, created, **kwargs):
    """Special handling for user model changes"""
    if created:
        # New user created
        create_audit_log(
            model='User',
            action='create',
            by=None,  # System action
            number=instance.username,
            before_data=None,
            after_data=get_model_data(instance)
        )

# Manual audit logging functions for specific actions
def audit_user_action(user, action, model_name, record_number=None, before_data=None, after_data=None):
    """Manually create audit log for user actions"""
    try:
        create_audit_log(
            model=model_name,
            action=action,
            by=user,
            number=record_number,
            before_data=before_data,
            after_data=after_data
        )
    except Exception as e:
        print(f"Error creating manual audit log: {e}")

def audit_system_action(action, model_name, record_number=None, before_data=None, after_data=None):
    """Manually create audit log for system actions"""
    try:
        create_audit_log(
            model=model_name,
            action=action,
            by=None,  # System action
            number=record_number,
            before_data=before_data,
            after_data=after_data
        )
    except Exception as e:
        print(f"Error creating system audit log: {e}")

# Context manager to ensure current user is set for audit logging
class AuditContext:
    """Context manager to ensure current user is set for audit logging"""
    
    def __init__(self, user):
        self.user = user
        self.previous_user = None
    
    def __enter__(self):
        # Store the previous user
        self.previous_user = get_current_user()
        # Set the current user
        set_current_user(self.user)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore the previous user
        if self.previous_user:
            set_current_user(self.previous_user)
        else:
            from .middleware import clear_current_user
            clear_current_user()

# Decorator to ensure current user is set for audit logging in views
def with_audit_user(user):
    """Decorator to ensure current user is set for audit logging"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            with AuditContext(user):
                return func(*args, **kwargs)
        return wrapper
    return decorator
