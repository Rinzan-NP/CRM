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
    if user and not isinstance(user, AnonymousUser):
        AuditLog.objects.create(
            user=user,
            action='CREATE' if created else 'UPDATE',
            model_name=sender._meta.model_name,
            object_id=str(instance.pk),
            changes=getattr(instance, '_tracked_changes', {})
        )

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if _should_ignore(sender):
        return
    user = get_current_user()
    if user and not isinstance(user, AnonymousUser):
        AuditLog.objects.create(
            user=user,
            action='DELETE',
            model_name=sender._meta.model_name,
            object_id=str(instance.pk),
            changes={}
        )