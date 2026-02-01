from django.contrib import admin
from .models import Expediente, Documento


@admin.register(Expediente)
class ExpedienteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'empleado', 'departamento', 'estado', 'fecha_creacion']
    list_filter = ['estado', 'departamento', 'fecha_creacion']
    search_fields = ['codigo', 'empleado__username', 'empleado__email']
    readonly_fields = ['codigo', 'fecha_creacion', 'fecha_actualizacion']


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'expediente', 'tipo_documento', 'estado', 'fecha_subida']
    list_filter = ['estado', 'tipo_documento', 'fecha_subida']
    search_fields = ['nombre_archivo', 'expediente__codigo', 'expediente__empleado__username']
    readonly_fields = ['fecha_subida', 'fecha_actualizacion']