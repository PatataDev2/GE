from django.db import migrations


def migrate_employee_to_recepcionista(apps, schema_editor):
    UsersCustom = apps.get_model('users', 'UsersCustom')
    UsersCustom.objects.filter(rol='employee').update(rol='recepcionista')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_alter_userscustom_rol'),
    ]

    operations = [
        migrations.RunPython(migrate_employee_to_recepcionista),
    ]
