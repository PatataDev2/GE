from django.db import models


class DocumentType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_required = models.BooleanField(default=False, help_text="Si es True, este documento es obligatorio para enviar a revisión")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'document_types'
        ordering = ['name']

    def __str__(self):
        return self.name
