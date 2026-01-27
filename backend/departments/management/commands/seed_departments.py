from django.core.management.base import BaseCommand
from departments.models import Department


class Command(BaseCommand):
    help = 'Seed the database with initial department data'

    def handle(self, *args, **kwargs):
        departments = [
            {
                'name': 'Recursos Humanos',
                'description': 'Gestión del personal, contratación, nóminas y beneficios.'
            },
            {
                'name': 'Tecnología',
                'description': 'Desarrollo de software, infraestructura técnica y soporte TI.'
            },
            {
                'name': 'Marketing',
                'description': 'Publicidad, relaciones públicas, branding y campañas digitales.'
            },
            {
                'name': 'Ventas',
                'description': 'Gestión de clientes, ventas directas y estrategias comerciales.'
            },
            {
                'name': 'Finanzas',
                'description': 'Contabilidad, presupuestos, informes financieros y auditoría.'
            },
            {
                'name': 'Operaciones',
                'description': 'Logística, cadena de suministro y optimización de procesos.'
            },
            {
                'name': 'Atención al Cliente',
                'description': 'Soporte postventa, servicio al cliente y gestión de quejas.'
            },
            {
                'name': 'Investigación y Desarrollo',
                'description': 'Innovación de productos, investigación de mercado y desarrollo de nuevos proyectos.'
            },
            {
                'name': 'Calidad',
                'description': 'Control de calidad, auditorías internas y mejora continua.'
            },
            {
                'name': 'Legal',
                'description': 'Asesoría legal, cumplimiento normativo y gestión de contratos.'
            }
        ]

        created_count = 0
        for dept_data in departments:
            department, created = Department.objects.get_or_create(
                name=dept_data['name'],
                defaults={'description': dept_data['description']}
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Department "{department.name}" created successfully')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Department "{department.name}" already exists')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Seeding completed. {created_count} departments created.')
        )