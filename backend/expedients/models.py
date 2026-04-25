from django.db import models
from django.conf import settings
from departments.models import Department #


    

class Expedient(models.Model):
    STATUS = [
        ("Aprobado", "Aprobado"),
        ("Pendiente", "Pendiente"),
        ("Proceso", "Proceso"),
        ("Finalizado", "Finalizado"),
        ("Rechazado", "Rechazado"),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default="Pendiente")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="expedientes", null=True, blank=True)
    # Relación con el usuario personalizado
    asinged_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expedientes_asignados",
        # NOTA: Filtramos por el campo 'name' del modelo 'Role' relacionado
        limit_choices_to={'role__name': 'employee'}, 
        verbose_name="Asignado a"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.asinged_to.username}"