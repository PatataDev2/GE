from django.db import migrations


def seed_departments(apps, schema_editor):
    Department = apps.get_model('departments', 'Department')
    departments = [
        {'name': 'Recursos Humanos', 'description': 'Gestión del personal, contratación, nóminas y beneficios.'},
        {'name': 'Tecnología', 'description': 'Desarrollo de software, infraestructura técnica y soporte TI.'},
        {'name': 'Marketing', 'description': 'Publicidad, relaciones públicas, branding y campañas digitales.'},
        {'name': 'Ventas', 'description': 'Gestión de clientes, ventas directas y estrategias comerciales.'},
        {'name': 'Finanzas', 'description': 'Contabilidad, presupuestos, informes financieros y auditoría.'},
        {'name': 'Operaciones', 'description': 'Logística, cadena de suministro y optimización de procesos.'},
        {'name': 'Atención al Cliente', 'description': 'Soporte postventa, servicio al cliente y gestión de quejas.'},
        {'name': 'Investigación y Desarrollo', 'description': 'Innovación de productos, investigación de mercado y desarrollo de nuevos proyectos.'},
        {'name': 'Calidad', 'description': 'Control de calidad, auditorías internas y mejora continua.'},
        {'name': 'Legal', 'description': 'Asesoría legal, cumplimiento normativo y gestión de contratos.'},
    ]
    for dept in departments:
        Department.objects.get_or_create(
            name=dept['name'],
            defaults={'description': dept['description']}
        )


def reverse_seed(apps, schema_editor):
    Department = apps.get_model('departments', 'Department')
    Department.objects.filter(
        name__in=[
            'Recursos Humanos', 'Tecnología', 'Marketing', 'Ventas',
            'Finanzas', 'Operaciones', 'Atención al Cliente',
            'Investigación y Desarrollo', 'Calidad', 'Legal',
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('departments', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(seed_departments, reverse_seed),
    ]
