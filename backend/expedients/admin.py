from django.contrib import admin
from .models import Expedient


@admin.register(Expedient)
class ExpedientAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'status', 'is_draft', 'created_by', 'asinged_to', 'department', 'created_at')
    list_filter = ('status', 'is_draft', 'department')
    search_fields = ('title', 'description', 'id')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Información', {
            'fields': ('title', 'description', 'status', 'is_draft', 'department')
        }),
        ('Asignación', {
            'fields': ('created_by', 'asinged_to', 'approved_by', 'rejected_by')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
