from django.core.management.base import BaseCommand
from document_types.models import DocumentType


class Command(BaseCommand):
    help = 'Seed database with initial document types data'

    def handle(self, *args, **kwargs):
        document_types = [
            {
                'name': 'Cédula de Identidad',
                'description': 'Documento oficial de identificación personal emitido por el gobierno.'
            },
            {
                'name': 'Pasaporte',
                'description': 'Documento de viaje e identificación internacional.'
            },
            {
                'name': 'Licencia de Conducir',
                'description': 'Permiso oficial para conducir vehículos de motor.'
            },
            {
                'name': 'Registro de Nacimiento',
                'description': 'Certificado oficial de nacimiento emitido por el registro civil.'
            },
            {
                'name': 'Título Universitario',
                'description': 'Documento académico que certifica la culminación de estudios superiores.'
            },
            {
                'name': 'Certificado de Estudios',
                'description': 'Constancia oficial de estudios realizados o en curso.'
            },
            {
                'name': 'Carta de Trabajo',
                'description': 'Documento que certifica la experiencia laboral de una persona.'
            },
            {
                'name': 'Comprobante de Domicilio',
                'description': 'Documento que verifica la dirección de residencia.'
            },
            {
                'name': 'Acta de Matrimonio',
                'description': 'Documento oficial que certifica el matrimonio civil o religioso.'
            },
            {
                'name': 'CURP',
                'description': 'Clave Única de Registro de Población de México.'
            },
            {
                'name': 'RFC',
                'description': 'Registro Federal de Contribuyentes para fines fiscales.'
            },
            {
                'name': 'INE',
                'description': 'Instituto Nacional Electoral - credencia para votar en México.'
            },
            {
                'name': 'Visa',
                'description': 'Autorización oficial para ingresar y permanecer en un país extranjero.'
            },
            {
                'name': 'Permiso de Residencia',
                'description': 'Documento que autoriza la residencia legal en un país.'
            },
            {
                'name': 'Certificado Médico',
                'description': 'Documento emitido por profesional médico que certifica estado de salud.'
            }
        ]

        created_count = 0
        for doc_type_data in document_types:
            doc_type, created = DocumentType.objects.get_or_create(
                name=doc_type_data['name'],
                defaults={
                    'description': doc_type_data['description'],
                    'is_active': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Document Type "{doc_type.name}" created successfully')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Document Type "{doc_type.name}" already exists')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Seeding completed. {created_count} document types created.')
        )