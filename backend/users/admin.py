from django.contrib import admin
from .models import Role, UsersCustom


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
            'fields': ('rol', 'role', 'clave_temporal', 'cuenta_activa', 'is_active', 'is_staff', 'is_superuser')
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if obj.rol and not obj.role:
            role_obj, _ = Role.objects.get_or_create(name=obj.rol)
            obj.role = role_obj
            obj.save(update_fields=['role'])
