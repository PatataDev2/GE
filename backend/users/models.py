from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


class UsersCustom(AbstractUser):
    """
    Custom user model that extends the default Django user model.
    You can add additional fields here if needed.
    """
    # Example of adding a custom field
    # bio = models.TextField(blank=True, null=True)
    cedula = models.CharField(max_length=20, unique=True, blank=False, null=False)
    phone = models.CharField(max_length=15, unique=True, blank=False, null=False)
    
    def __str__(self):
        return self.username  # or self.email, or any other field you prefer