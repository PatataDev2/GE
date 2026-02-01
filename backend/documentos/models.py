from django.db import models

from users.models import UsersCustom
from departments.models import Department
from document_types.models import DocumentType

# Create your models here.
class Expediente(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    usuario = models.ForeignKey(UsersCustom, on_delete=models.SET_NULL, null=True, blank=True, related_name='expedientes')
    nombre_referencia = models.CharField(max_length=200, blank=True, null=True, help_text="Nombre de referencia si no hay usuario ligado")
    departamento = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='expedientes', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def __str__(self):
        return f"{self.titulo} - {self.departamento.name}"

    @property
    def numero_de_documentos(self):
        return self.documentos.count()

class Documento(models.Model):
    expediente = models.ForeignKey(Expediente, related_name='documentos', on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    documento = models.FileField(upload_to='documentos/')
    tipo = models.ForeignKey(DocumentType, on_delete=models.PROTECT, related_name='documentos', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return self.titulo
    
