from django.contrib import admin
from .models import UsersCustom


@admin.register(UsersCustom)
class UsersCustomAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'last_name', 'email', 'cedula', 'rol', 'clave_temporal', 'cuenta_activa')
    list_filter = ('rol', 'cuenta_activa', 'clave_temporal')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'cedula')
    fieldsets = (
        ('Información personal', {
            'fields': ('username', 'first_name', 'last_name', 'email', 'cedula', 'phone')
        }),
        ('Control de acceso', {
            'fields': ('rol', 'clave_temporal', 'cuenta_activa', 'is_active', 'is_staff', 'is_superuser')
        }),
    )
