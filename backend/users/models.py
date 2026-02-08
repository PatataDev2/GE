from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class Role(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('analyst', 'Analista'),
        ('employee', 'Empleado'),
        ('user', 'Usuario Normal'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        role_dict = dict(self.ROLE_CHOICES)
        return role_dict.get(str(self.name), str(self.name))


class UsersCustom(AbstractUser):
    """
    Custom user model that extends the default Django user model.
    You can add additional fields here if needed.
    """
    # Example of adding a custom field
    # bio = models.TextField(blank=True, null=True)
    cedula = models.CharField(max_length=20, unique=True, blank=False, null=False)
    phone = models.CharField(max_length=15, unique=True, blank=False, null=False)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, default=None)
    
    def __str__(self):
        return self.username  # or self.email, or any other field you prefer
    
    @property
    def is_admin(self):
        return self.role and self.role.name == 'admin'
    
    @property
    def is_analyst(self):
        return self.role and self.role.name == 'analyst'
    
    @property
    def is_employee(self):
        return self.role and self.role.name == 'employee'