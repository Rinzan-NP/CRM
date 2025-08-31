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
        ('', 'Salesperson'),
        ('accountant', 'Accountant'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='salesperson')
    blocked = models.BooleanField(default=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='users')