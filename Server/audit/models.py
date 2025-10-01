from django.db import models
from django.utils import timezone
from accounts.models import User
import json


class AuditLog(models.Model):
    """
    Centralized audit logging model to track all changes across the system.
    """
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('block', 'Block'),
        ('unblock', 'Unblock'),
        ('read', 'Read'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    model_name = models.CharField(max_length=100, help_text="Name of the model being audited (e.g., 'Customer', 'Invoice')")
    record_number = models.CharField(max_length=100, null=True, blank=True, help_text="Record identifier (e.g., 'INV-1001', 'SO-2001')")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, help_text="Action performed on the record")
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="User who performed the action")
    before_data = models.JSONField(null=True, blank=True, help_text="Data before the change (for updates)")
    after_data = models.JSONField(null=True, blank=True, help_text="Data after the change")
    timestamp = models.DateTimeField(default=timezone.now, help_text="When the action was performed")
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name']),
            models.Index(fields=['action']),
            models.Index(fields=['performed_by']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        user_info = f" by {self.performed_by}" if self.performed_by else " by System"
        record_info = f" ({self.record_number})" if self.record_number else ""
        return f"{self.model_name}{record_info} {self.action}{user_info} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
    
    @property
    def formatted_before_data(self):
        """Return formatted JSON for display in admin"""
        if self.before_data:
            return json.dumps(self.before_data, indent=2, ensure_ascii=False)
        return "N/A"
    
    @property
    def formatted_after_data(self):
        """Return formatted JSON for display in admin"""
        if self.after_data:
            return json.dumps(self.after_data, indent=2, ensure_ascii=False)
        return "N/A"
