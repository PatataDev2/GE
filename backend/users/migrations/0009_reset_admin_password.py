from django.db import migrations
from django.contrib.auth.hashers import make_password


def reset_admin_password(apps, schema_editor):
    UsersCustom = apps.get_model('users', 'UsersCustom')
    admin_user = UsersCustom.objects.filter(username='admin').first()
    if admin_user:
        admin_user.password = make_password('patata18')
        admin_user.save(update_fields=['password'])


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_migrate_employee_to_recepcionista'),
    ]

    operations = [
        migrations.RunPython(reset_admin_password, reverse_func),
    ]
