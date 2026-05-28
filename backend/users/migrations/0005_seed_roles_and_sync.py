from django.db import migrations


def seed_roles_and_sync(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    UsersCustom = apps.get_model('users', 'UsersCustom')

    roles_data = [
        ('admin', 'Administrador del sistema con acceso completo'),
        ('analyst', 'Analista que puede revisar y validar expedientes'),
        ('employee', 'Trabajador que puede subir y gestionar sus expedientes'),
        ('user', 'Usuario normal con acceso básico'),
    ]

    role_map = {}
    for name, description in roles_data:
        role_obj, created = Role.objects.get_or_create(
            name=name,
            defaults={'description': description}
        )
        role_map[name] = role_obj

    for user in UsersCustom.objects.all():
        if not user.role_id and user.rol:
            role_obj = role_map.get(user.rol)
            if role_obj:
                user.role = role_obj
                user.save(update_fields=['role'])


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_userscustom_clave_temporal_userscustom_cuenta_activa_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_roles_and_sync, reverse_func),
    ]
