import io
import tempfile

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from departments.models import Department
from document_types.models import DocumentType
from expedients.models import Expedient
from users.models import UsersCustom

TEST_PASSWORD = 'testpass123'


@pytest.fixture
def recepcionista_user(db):
    return UsersCustom.objects.create_user(
        username='test_recepcionista',
        email='recepcionista@test.com',
        password=TEST_PASSWORD,
        rol='recepcionista',
        cedula='12345678',
        first_name='Recepcionista',
        last_name='Test',
        clave_temporal=False,
    )


@pytest.fixture
def analyst_user(db):
    return UsersCustom.objects.create_user(
        username='test_analyst',
        email='analyst@test.com',
        password=TEST_PASSWORD,
        rol='analyst',
        cedula='23456789',
        first_name='Analyst',
        last_name='Test',
        clave_temporal=False,
    )


@pytest.fixture
def admin_user(db):
    return UsersCustom.objects.create_user(
        username='test_admin',
        email='admin@test.com',
        password=TEST_PASSWORD,
        rol='admin',
        cedula='34567890',
        first_name='Admin',
        last_name='Test',
        clave_temporal=False,
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    def _auth_client(user):
        api_client.force_authenticate(user=user)
        return api_client
    return _auth_client


@pytest.fixture
def admin_client(admin_user, auth_client):
    return auth_client(admin_user)


@pytest.fixture
def analyst_client(analyst_user, auth_client):
    return auth_client(analyst_user)


@pytest.fixture
def recepcionista_client(recepcionista_user, auth_client):
    return auth_client(recepcionista_user)


@pytest.fixture
def department(db):
    return Department.objects.create(
        name='Test Department',
        description='Test Description',
    )


@pytest.fixture
def document_type_required(db):
    return DocumentType.objects.create(
        name='Test Required Doc',
        description='Required for review',
        is_required=True,
    )


@pytest.fixture
def document_type_optional(db):
    return DocumentType.objects.create(
        name='Test Optional Doc',
        description='Optional',
        is_required=False,
    )


@pytest.fixture
def expedient(db, department, recepcionista_user, admin_user):
    return Expedient.objects.create(
        title='Test Expedient',
        description='Test Description',
        status='Pendiente',
        is_draft=True,
        department=department,
        asinged_to=recepcionista_user,
        created_by=admin_user,
    )


@pytest.fixture
def expedient_aprobado(db, department, recepcionista_user, admin_user):
    return Expedient.objects.create(
        title='Approved Expedient',
        description='Already approved',
        status='Aprobado',
        is_draft=False,
        department=department,
        asinged_to=recepcionista_user,
        created_by=admin_user,
        approved_by=admin_user,
    )


@pytest.fixture
def expedient_pre_aprobado(db, department, recepcionista_user, analyst_user):
    return Expedient.objects.create(
        title='Pre-Approved Expedient',
        description='Waiting admin approval',
        status='Pre_Aprobado',
        is_draft=False,
        department=department,
        asinged_to=recepcionista_user,
        created_by=analyst_user,
        approved_by=analyst_user,
    )


@pytest.fixture
def expedient_rechazado(db, department, recepcionista_user, admin_user):
    return Expedient.objects.create(
        title='Rejected Expedient',
        description='Was rejected',
        status='Rechazado',
        is_draft=False,
        department=department,
        asinged_to=recepcionista_user,
        created_by=admin_user,
        rejected_by=admin_user,
    )


def _make_pdf_bytes():
    return b'%PDF-1.4 test content ' + b'\x00' * 100


def _make_png_bytes():
    return b'\x89PNG\r\n\x1a\n' + b'\x00' * 100


def _make_docx_bytes():
    return b'PK\x03\x04' + b'\x00' * 100


@pytest.fixture
def pdf_file():
    return SimpleUploadedFile(
        'test.pdf',
        _make_pdf_bytes(),
        content_type='application/pdf',
    )


@pytest.fixture
def png_file():
    return SimpleUploadedFile(
        'test.png',
        _make_png_bytes(),
        content_type='image/png',
    )


@pytest.fixture
def fake_pdf_file():
    return SimpleUploadedFile(
        'fake.pdf',
        _make_png_bytes(),
        content_type='application/pdf',
    )


@pytest.fixture
def docx_file():
    return SimpleUploadedFile(
        'test.docx',
        _make_docx_bytes(),
        content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )


@pytest.fixture
def oversized_file():
    return SimpleUploadedFile(
        'large.pdf',
        b'%PDF-1.4 ' + b'X' * (11 * 1024 * 1024),
        content_type='application/pdf',
    )


@pytest.fixture
def invalid_extension_file():
    return SimpleUploadedFile(
        'malware.exe',
        b'%PDF-1.4 test',
        content_type='application/x-msdownload',
    )


@pytest.fixture
def document(db, expedient, document_type_required, recepcionista_user, pdf_file):
    from documents.models import Document
    return Document.objects.create(
        title='Test Document',
        file=pdf_file,
        expedient=expedient,
        document_type=document_type_required,
        uploaded_by=recepcionista_user,
        approval_status=None,
    )


@pytest.fixture
def document_approved(db, expedient, document_type_optional, recepcionista_user, pdf_file):
    from documents.models import Document
    return Document.objects.create(
        title='Approved Document',
        file=pdf_file,
        expedient=expedient,
        document_type=document_type_optional,
        uploaded_by=recepcionista_user,
        approval_status=True,
    )


@pytest.fixture
def document_rejected(db, expedient, document_type_optional, recepcionista_user, pdf_file):
    from documents.models import Document
    return Document.objects.create(
        title='Rejected Document',
        file=pdf_file,
        expedient=expedient,
        document_type=document_type_optional,
        uploaded_by=recepcionista_user,
        approval_status=False,
    )


@pytest.fixture
def document_in_aprobado(db, expedient_aprobado, document_type_optional, recepcionista_user, pdf_file):
    from documents.models import Document
    return Document.objects.create(
        title='Pending in Approved',
        file=pdf_file,
        expedient=expedient_aprobado,
        document_type=document_type_optional,
        uploaded_by=recepcionista_user,
        approval_status=None,
    )
