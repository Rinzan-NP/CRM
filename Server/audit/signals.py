from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from audit.models import AuditLog
from .middleware import get_current_user
from django.contrib.auth.models import AnonymousUser

# Put the full dotted name here so we can compare strings
IGNORE = {
    'contenttypes.contenttype',
    'auth.permission',
    'admin.logentry',
    'sessions.session',
    'migrations.migration',
    'audit.auditlog',
}

def _should_ignore(sender):
    return f"{sender._meta.app_label}.{sender._meta.model_name}".lower() in IGNORE

@receiver(post_save)
def log_create_or_update(sender, instance, created, **kwargs):
    if _should_ignore(sender):
        return
    
    user = get_current_user()
    # Debug logging
    print(f"Audit signal triggered for {sender._meta.model_name}")
    print(f"Current user: {user}")
    print(f"User type: {type(user)}")
    print(f"Is authenticated: {user.is_authenticated if hasattr(user, 'is_authenticated') else 'N/A'}")
    
    # Allow both authenticated users and superusers
    if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
        try:
            AuditLog.objects.create(
                user=user,
                action='CREATE' if created else 'UPDATE',
                model_name=sender._meta.model_name,
                object_id=str(instance.pk),
                changes=getattr(instance, '_tracked_changes', {})
            )
            print(f"Audit log created successfully for user: {user}")
        except Exception as e:
            print(f"Failed to create audit log: {e}")

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if _should_ignore(sender):
        return
        
    user = get_current_user()
    print(f"Delete signal triggered for {sender._meta.model_name}")
    print(f"Current user: {user}")
    
    # Allow both authenticated users and superusers
    if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
        try:
            AuditLog.objects.create(
                user=user,
                action='DELETE',
                model_name=sender._meta.model_name,
                object_id=str(instance.pk),
                changes={}
            )
            print(f"Delete audit log created successfully for user: {user}")
        except Exception as e:
            print(f"Failed to create delete audit log: {e}")

