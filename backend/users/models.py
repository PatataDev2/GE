from django.db import models
from django.contrib.auth.models import AbstractUser

ROL_CHOICES = [
    ('admin', 'Administrador'),
    ('analyst', 'Analista'),
    ('employee', 'Empleado'),
]


class Role(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('analyst', 'Analista'),
        ('employee', 'Trabajador'),
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
    cedula = models.CharField(max_length=20, unique=True, blank=False, null=False)
    phone = models.CharField(max_length=15, unique=True, blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, default=None)

    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='employee')
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
    def is_employee(self):
        return self.rol == 'employee'

    @property
    def rol_display(self):
        return dict(ROL_CHOICES).get(self.rol, self.rol)