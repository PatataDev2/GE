from django.db import models

# Create your models here.
class Expediente(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    
    def __str__(self):
        return self.titulo

    @property
    def numero_de_documentos(self):
        return self.documentos.count()

class Documento(models.Model):
    expediente = models.ForeignKey(Expediente, related_name='documentos', on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    documento = models.FileField(upload_to='documentos/')

    def __str__(self):
        return self.titulo
