from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # Nullable for system actions
    action = models.CharField(max_length=20)          # CREATE / UPDATE / DELETE
    model_name = models.CharField(max_length=100)     # e.g. "SalesOrder"
    object_id = models.CharField(max_length=50)       # UUID or PK
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["model_name", "object_id"]),
        ]

    def __str__(self):
        return f"{self.user} {self.action} {self.model_name} @ {self.timestamp}"