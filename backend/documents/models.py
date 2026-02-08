import os
from django.db import models
from django.conf import settings
from expedients.models import Expedient 
from document_types.models import DocumentType

def document_upload_path(instance, filename):
    """
    Genera la ruta: uploads/docs/expediente_ID/nombre_archivo.pdf
    """
    return f'uploads/docs/expedient_{instance.expedient.id}/{filename}'

class Document(models.Model):
    title = models.CharField(max_length=255)
    
    # El archivo físico ahora usa la función dinámica
    file = models.FileField(upload_to=document_upload_path)
    
    # Estos campos se llenarán automáticamente en el método save()
    path = models.CharField(
        max_length=500, 
        blank=True, 
        help_text="Ruta relativa del archivo en el servidor"
    )
    docname = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="Nombre original del archivo"
    )

    description_state = models.CharField(max_length=100, blank=True, null=True)
    description_content = models.TextField(blank=True, null=True)
    description_corrections = models.TextField(blank=True, null=True)

    expedient = models.ForeignKey(
        Expedient, 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    document_type = models.ForeignKey(
        DocumentType, 
        on_delete=models.SET_NULL, 
        null=True
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )

    approval_status = models.BooleanField(default=False)
    expiration_date = models.DateField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Al guardar, extraemos el nombre y la ruta del archivo
        if self.file:
            self.docname = os.path.basename(self.file.name)
            # Guardamos la ruta relativa que Django genera
            self.path = self.file.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.expedient.id}"