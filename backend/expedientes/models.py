from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Expediente(models.Model):
    ESTADO_CHOICES = [
        ('solicitado', 'Solicitado'),
        ('en_proceso', 'En Proceso'),
        ('revision_analista', 'Revisión Analista'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('cerrado', 'Cerrado'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True)
    empleado = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expedientes')
    nombre_expediente = models.CharField(max_length=200, help_text="Nombre descriptivo del expediente")
    departamento = models.CharField(max_length=100)
    solicitado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='expedientes_solicitados')
    observaciones = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='solicitado')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    respuesta_final = models.TextField(blank=True, help_text="Respuesta final del admin")
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Expediente'
        verbose_name_plural = 'Expedientes'
    
    def __str__(self):
        return f"{self.codigo} - {self.empleado.username}"


class Documento(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado_analista', 'Aprobado por Analista'),
        ('rechazado_analista', 'Rechazado por Analista'),
        ('aprobado_final', 'Aprobado Final'),
        ('rechazado_final', 'Rechazado Final'),
    ]
    
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, related_name='documentos')
    nombre_archivo = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='documentos/')
    tipo_documento = models.ForeignKey('document_types.DocumentType', on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    observaciones = models.TextField(blank=True)
    fecha_subida = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    revisado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_revisados')
    
    class Meta:
        ordering = ['-fecha_subida']
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
    
    def __str__(self):
        return f"{self.nombre_archivo} - {self.expediente.codigo}"