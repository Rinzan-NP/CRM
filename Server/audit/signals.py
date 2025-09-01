from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from audit.models import AuditLog
from .middleware import get_current_user

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
        print(f"🚫 Ignoring {sender._meta.app_label}.{sender._meta.model_name}")
        return
    
    user = get_current_user()
    
    print(f"📝 Audit signal triggered:")
    print(f"   Model: {sender._meta.model_name}")
    print(f"   Action: {'CREATE' if created else 'UPDATE'}")
    print(f"   User: {user}")
    print(f"   User authenticated: {getattr(user, 'is_authenticated', False)}")
    
    if user and getattr(user, 'is_authenticated', False):
        try:
            audit_log = AuditLog.objects.create(
                user=user,
                action='CREATE' if created else 'UPDATE',
                model_name=sender._meta.model_name,
                object_id=str(instance.pk),
                changes=getattr(instance, '_tracked_changes', {})
            )
            print(f"✅ Audit log created successfully: {audit_log.id}")
        except Exception as e:
            print(f"❌ Failed to create audit log: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"⚠️  Skipping audit log - user not authenticated or None")

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if _should_ignore(sender):
        print(f"🚫 Ignoring delete for {sender._meta.app_label}.{sender._meta.model_name}")
        return
        
    user = get_current_user()
    
    print(f"🗑️  Delete signal triggered:")
    print(f"   Model: {sender._meta.model_name}")
    print(f"   User: {user}")
    print(f"   User authenticated: {getattr(user, 'is_authenticated', False)}")
    
    if user and getattr(user, 'is_authenticated', False):
        try:
            audit_log = AuditLog.objects.create(
                user=user,
                action='DELETE',
                model_name=sender._meta.model_name,
                object_id=str(instance.pk),
                changes={},
                company=user.company
            )
            print(f"✅ Delete audit log created successfully: {audit_log.id}")
        except Exception as e:
            print(f"❌ Failed to create delete audit log: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"⚠️  Skipping delete audit log - user not authenticated or None")
