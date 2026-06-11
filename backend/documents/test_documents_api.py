import pytest
from documents.models import Document
from expedients.models import Expedient


pytestmark = pytest.mark.django_db


class TestUploadDocument:
    def test_recepcionista_uploads(self, recepcionista_client, expedient, document_type_required, pdf_file):
        response = recepcionista_client.post('/api/documents/', {
            'title': 'New Doc',
            'expedient': expedient.id,
            'document_type': document_type_required.id,
            'file': pdf_file,
        })
        assert response.status_code == 201
        assert Document.objects.filter(title='New Doc').exists()

    def test_upload_to_approved_sets_pending_flag(self, recepcionista_client, expedient_aprobado, document_type_optional, pdf_file):
        assert expedient_aprobado.has_pending_updates is False
        response = recepcionista_client.post('/api/documents/', {
            'title': 'Post-Approval Doc',
            'expedient': expedient_aprobado.id,
            'document_type': document_type_optional.id,
            'file': pdf_file,
        })
        assert response.status_code == 201
        expedient_aprobado.refresh_from_db()
        assert expedient_aprobado.has_pending_updates is True

    def test_unauthenticated_upload(self, api_client, expedient, document_type_required, pdf_file):
        response = api_client.post('/api/documents/', {
            'title': 'No Auth',
            'expedient': expedient.id,
            'document_type': document_type_required.id,
            'file': pdf_file,
        })
        assert response.status_code == 401

    def test_magic_bytes_valid_pdf(self, recepcionista_client, expedient, document_type_required, pdf_file):
        response = recepcionista_client.post('/api/documents/', {
            'title': 'Valid PDF',
            'expedient': expedient.id,
            'document_type': document_type_required.id,
            'file': pdf_file,
        })
        assert response.status_code == 201

    def test_magic_bytes_reject_fake_pdf(self, recepcionista_client, expedient, document_type_required, fake_pdf_file):
        response = recepcionista_client.post('/api/documents/', {
            'title': 'Fake PDF',
            'expedient': expedient.id,
            'document_type': document_type_required.id,
            'file': fake_pdf_file,
        })
        assert response.status_code == 400
        assert 'no coincide' in str(response.data).lower() or 'contenido' in str(response.data).lower()

    def test_invalid_extension_rejected(self, recepcionista_client, expedient, document_type_required, invalid_extension_file):
        response = recepcionista_client.post('/api/documents/', {
            'title': 'Bad Ext',
            'expedient': expedient.id,
            'document_type': document_type_required.id,
            'file': invalid_extension_file,
        })
        assert response.status_code == 400

    def test_oversized_file_rejected(self, recepcionista_client, expedient, document_type_required, oversized_file):
        response = recepcionista_client.post('/api/documents/', {
            'title': 'Too Big',
            'expedient': expedient.id,
            'document_type': document_type_required.id,
            'file': oversized_file,
        })
        assert response.status_code == 400


class TestListDocuments:
    def test_list_by_expedient(self, admin_client, document):
        response = admin_client.get(f'/api/documents/?expedient={document.expedient.id}')
        assert response.status_code == 200
        data = response.data
        if isinstance(data, dict):
            data = data.get('results', [])
        assert any(d['id'] == document.id for d in data)

    def test_pending_review_admin(self, admin_client, document):
        response = admin_client.get('/api/documents/pending_review/')
        assert response.status_code == 200
        assert any(d['id'] == document.id for d in response.data)

    def test_pending_review_recepcionista_blocked(self, recepcionista_client):
        response = recepcionista_client.get('/api/documents/pending_review/')
        assert response.status_code == 403


class TestReviewDocument:
    def test_analyst_approves_document(self, analyst_client, document):
        response = analyst_client.post(f'/api/documents/{document.id}/review/', {
            'action': 'approve',
        })
        assert response.status_code == 200
        document.refresh_from_db()
        assert document.approval_status is True
        assert document.description_state == 'aprobado'

    def test_analyst_rejects_document(self, analyst_client, document):
        response = analyst_client.post(f'/api/documents/{document.id}/review/', {
            'action': 'reject',
            'message': 'Needs corrections',
            'corrections': 'Fix the format',
        })
        assert response.status_code == 200
        document.refresh_from_db()
        assert document.approval_status is False
        assert document.description_state == 'rechazado'
        assert document.description_corrections is not None

    def test_recepcionista_cannot_review(self, recepcionista_client, document):
        response = recepcionista_client.post(f'/api/documents/{document.id}/review/', {
            'action': 'approve',
        })
        assert response.status_code == 403

    def test_invalid_action(self, analyst_client, document):
        response = analyst_client.post(f'/api/documents/{document.id}/review/', {
            'action': 'invalid',
        })
        assert response.status_code == 400

    def test_review_clears_pending_flag(self, analyst_client, expedient_aprobado, document_type_optional, recepcionista_user, pdf_file):
        doc = Document.objects.create(
            title='Pending Doc', file=pdf_file, expedient=expedient_aprobado,
            document_type=document_type_optional, uploaded_by=recepcionista_user,
            approval_status=None,
        )
        expedient_aprobado.has_pending_updates = True
        expedient_aprobado.save()

        response = analyst_client.post(f'/api/documents/{doc.id}/review/', {
            'action': 'approve',
        })
        assert response.status_code == 200
        expedient_aprobado.refresh_from_db()
        assert expedient_aprobado.has_pending_updates is False

    def test_review_multiple_docs_flag(self, analyst_client, expedient_aprobado, document_type_optional, recepcionista_user, pdf_file):
        doc1 = Document.objects.create(
            title='Doc1', file=pdf_file, expedient=expedient_aprobado,
            document_type=document_type_optional, uploaded_by=recepcionista_user,
        )
        doc2 = Document.objects.create(
            title='Doc2', file=pdf_file, expedient=expedient_aprobado,
            document_type=document_type_optional, uploaded_by=recepcionista_user,
        )
        expedient_aprobado.has_pending_updates = True
        expedient_aprobado.save()

        analyst_client.post(f'/api/documents/{doc1.id}/review/', {'action': 'approve'})
        expedient_aprobado.refresh_from_db()
        assert expedient_aprobado.has_pending_updates is True

        analyst_client.post(f'/api/documents/{doc2.id}/review/', {'action': 'approve'})
        expedient_aprobado.refresh_from_db()
        assert expedient_aprobado.has_pending_updates is False


class TestReplaceFile:
    def test_replace_rejected_document(self, recepcionista_client, document_rejected, pdf_file):
        response = recepcionista_client.post(f'/api/documents/{document_rejected.id}/replace_file/', {
            'file': pdf_file,
        })
        assert response.status_code in (200, 302)

    def test_replace_approved_document_fails(self, recepcionista_client, document_approved, pdf_file):
        response = recepcionista_client.post(f'/api/documents/{document_approved.id}/replace_file/', {
            'file': pdf_file,
        })
        assert response.status_code == 400

    def test_replace_with_fake_file(self, recepcionista_client, document_rejected, fake_pdf_file):
        response = recepcionista_client.post(f'/api/documents/{document_rejected.id}/replace_file/', {
            'file': fake_pdf_file,
        })
        assert response.status_code == 400
