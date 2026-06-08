from django.db import models
from django.contrib.auth.models import AbstractUser

ROL_CHOICES = [
    ('admin', 'Administrador'),
    ('analyst', 'Analista'),
    ('recepcionista', 'Recepcionista'),
]


class UsersCustom(AbstractUser):
    cedula = models.CharField(max_length=20, unique=True, blank=False, null=False)
    phone = models.CharField(max_length=15, unique=True, blank=True, null=True)

    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='recepcionista')
    clave_temporal = models.BooleanField(default=True)
    cuenta_activa = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username

    @property
    def is_admin(self):
        return self.rol == 'admin'

    @property
    def is_analyst(self):
        return self.rol == 'analyst'

    @property
    def is_recepcionista(self):
        return self.rol == 'recepcionista'

    @property
    def rol_display(self):
        return dict(ROL_CHOICES).get(self.rol, self.rol)