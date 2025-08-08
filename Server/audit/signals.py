from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from audit.models import AuditLog

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
    AuditLog.objects.create(
        user=None,  # we’ll fill this later via middleware
        action='CREATE' if created else 'UPDATE',
        model_name=sender._meta.model_name,
        object_id=str(instance.pk),
        changes=getattr(instance, '_tracked_changes', {})
    )

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if _should_ignore(sender):
        return
    AuditLog.objects.create(
        user=None,
        action='DELETE',
        model_name=sender._meta.model_name,
        object_id=str(instance.pk),
        changes={}
    )