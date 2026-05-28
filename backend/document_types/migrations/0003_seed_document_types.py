from django.db import migrations


def seed_document_types(apps, schema_editor):
    DocumentType = apps.get_model('document_types', 'DocumentType')
    document_types = [
        {'name': 'Cédula de Identidad', 'description': 'Documento oficial de identificación personal emitido por el gobierno.', 'is_required': True},
        {'name': 'Pasaporte', 'description': 'Documento de viaje e identificación internacional.', 'is_required': False},
        {'name': 'Licencia de Conducir', 'description': 'Permiso oficial para conducir vehículos de motor.', 'is_required': False},
        {'name': 'Registro de Nacimiento', 'description': 'Certificado oficial de nacimiento emitido por el registro civil.', 'is_required': True},
        {'name': 'Título Universitario', 'description': 'Documento académico que certifica la culminación de estudios superiores.', 'is_required': False},
        {'name': 'Certificado de Estudios', 'description': 'Constancia oficial de estudios realizados o en curso.', 'is_required': False},
        {'name': 'Carta de Trabajo', 'description': 'Documento que certifica la experiencia laboral de una persona.', 'is_required': False},
        {'name': 'Comprobante de Domicilio', 'description': 'Documento que verifica la dirección de residencia.', 'is_required': True},
        {'name': 'Acta de Matrimonio', 'description': 'Documento oficial que certifica el matrimonio civil o religioso.', 'is_required': False},
        {'name': 'CURP', 'description': 'Clave Única de Registro de Población de México.', 'is_required': True},
        {'name': 'RFC', 'description': 'Registro Federal de Contribuyentes para fines fiscales.', 'is_required': True},
        {'name': 'INE', 'description': 'Instituto Nacional Electoral - credencial para votar en México.', 'is_required': True},
        {'name': 'Visa', 'description': 'Autorización oficial para ingresar y permanecer en un país extranjero.', 'is_required': False},
        {'name': 'Permiso de Residencia', 'description': 'Documento que autoriza la residencia legal en un país.', 'is_required': False},
        {'name': 'Certificado Médico', 'description': 'Documento emitido por profesional médico que certifica estado de salud.', 'is_required': False},
    ]
    for dt in document_types:
        DocumentType.objects.get_or_create(
            name=dt['name'],
            defaults={
                'description': dt['description'],
                'is_active': True,
                'is_required': dt['is_required'],
            }
        )


def reverse_seed(apps, schema_editor):
    DocumentType = apps.get_model('document_types', 'DocumentType')
    DocumentType.objects.filter(
        name__in=[
            'Cédula de Identidad', 'Pasaporte', 'Licencia de Conducir',
            'Registro de Nacimiento', 'Título Universitario', 'Certificado de Estudios',
            'Carta de Trabajo', 'Comprobante de Domicilio', 'Acta de Matrimonio',
            'CURP', 'RFC', 'INE', 'Visa', 'Permiso de Residencia', 'Certificado Médico',
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('document_types', '0002_documenttype_is_required'),
    ]
    operations = [
        migrations.RunPython(seed_document_types, reverse_seed),
    ]
