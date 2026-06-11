from django.db import migrations
from django.contrib.auth.hashers import make_password


def reset_passwords(apps, schema_editor):
    UsersCustom = apps.get_model('users', 'UsersCustom')
    pw = make_password('patata18')
    for user in UsersCustom.objects.all():
        user.password = pw
        user.save(update_fields=['password'])


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_reset_admin_password'),
    ]

    operations = [
        migrations.RunPython(reset_passwords, reverse_func),
    ]
