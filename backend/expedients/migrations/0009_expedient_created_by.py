import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('expedients', '0008_alter_expedient_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='expedient',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='expedientes_creados',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Creado por',
            ),
        ),
    ]
