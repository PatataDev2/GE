from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    ACTION_TYPES = [
        ('create', 'Creación'),
        ('edit', 'Edición'),
        ('delete', 'Eliminación'),
        ('approve', 'Aprobación'),
        ('reject', 'Rechazo'),
        ('upload', 'Subida'),
        ('login', 'Inicio de sesión'),
        ('logout', 'Cierre de sesión'),
        ('backup', 'Respaldo'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name='Usuario'
    )
    action = models.CharField(max_length=255, verbose_name='Acción')
    target = models.CharField(max_length=255, blank=True, default='-', verbose_name='Objetivo')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES, verbose_name='Tipo de acción')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='Dirección IP')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha/Hora')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Registro de Actividad'
        verbose_name_plural = 'Registros de Actividad'

    def __str__(self):
        return f'{self.user.username if self.user else "Sistema"} - {self.action} ({self.created_at})'


class Notification(models.Model):
    TYPE_CHOICES = [
        ('asignado', 'Asignado'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('revision', 'En Revision'),
        ('correccion', 'Correccion Requerida'),
        ('info', 'Informacion'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinatario'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_created',
        verbose_name='Actor'
    )
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    expedient_id = models.IntegerField(null=True, blank=True)
    document_id = models.IntegerField(null=True, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.recipient.username}'
