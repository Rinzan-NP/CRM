from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('salesperson', 'Salesperson'),  # Corrected key
        ('accountant', 'Accountant'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='salesperson')
    blocked = models.BooleanField(default=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Check if this is a new user or if password has changed
        if not self.pk or self._password_changed:
            # Hash the password if it's not already hashed
            if self.password and not self.password.startswith('pbkdf2_'):
                self.set_password(self.password)
        super().save(*args, **kwargs)
    
    def _password_changed(self):
        """Check if password has changed"""
        if not self.pk:
            return True
        try:
            old_user = User.objects.get(pk=self.pk)
            return old_user.password != self.password
        except User.DoesNotExist:
            return True