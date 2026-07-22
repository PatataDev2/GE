# -*- coding: utf-8 -*-
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '/app')
django.setup()

from documents.models import Document
from expedients.models import Expedient
from django.contrib.auth import get_user_model
User = get_user_model()

recepcionista = User.objects.get(username='pepeempleado')
exp = Expedient.objects.get(id=6)

print('Recepcionista: {} (id={})'.format(recepcionista.username, recepcionista.id))
print('Expediente: #{} {} status={}'.format(exp.id, exp.title, exp.status))
print('Asignado a: {}'.format(exp.asinged_to.username if exp.asinged_to else 'Nadie'))

from django.core.files.uploadedfile import SimpleUploadedFile

test_file = SimpleUploadedFile('test_doc.pdf', b'fake pdf content', content_type='application/pdf')

doc = Document.objects.create(
    title='Documento de prueba',
    file=test_file,
    expedient=exp,
    uploaded_by=recepcionista,
    document_type_id=1,
    approval_status=None,
    path='uploads/docs/{}/test_doc.pdf'.format(exp.id),
    docname='test_doc.pdf'
)

print('Documento creado: #{} {} approval_status={}'.format(doc.id, doc.title, doc.approval_status))

pending = Document.objects.filter(approval_status=None, expedient__status='Aprobado')
print('Docs pendientes en expedientes Aprobados: {}'.format(pending.count()))
for d in pending:
    print('  #{}: {} -> expediente #{} ({})'.format(d.id, d.title, d.expedient.id, d.expedient.status))

doc.delete()
print('Documento de prueba eliminado')
