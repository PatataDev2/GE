import pytest
from django.urls import reverse
from expedients.models import Expedient
from notifications.models import Notification
from users.models import UsersCustom


pytestmark = pytest.mark.django_db


class TestCreateExpedient:
    def test_admin_creates_expedient(self, admin_client, expedient):
        data = {
            'title': 'New Admin Expedient',
            'description': 'Created by admin',
            'asinged_to': expedient.asinged_to_id,
            'department': expedient.department_id,
        }
        response = admin_client.post('/api/expedients/', data)
        assert response.status_code == 201
        assert response.data['status'] == 'Pendiente'

    def test_analyst_creates_expedient(self, analyst_client, expedient):
        data = {
            'title': 'New Analyst Expedient',
            'description': 'Created by analyst',
            'asinged_to': expedient.asinged_to_id,
            'department': expedient.department_id,
        }
        response = analyst_client.post('/api/expedients/', data)
        assert response.status_code == 201

    def test_recepcionista_cannot_create(self, recepcionista_client, expedient):
        data = {
            'title': 'Blocked',
            'description': 'Recep cannot create',
            'asinged_to': expedient.asinged_to_id,
            'department': expedient.department_id,
        }
        response = recepcionista_client.post('/api/expedients/', data)
        assert response.status_code == 403

    def test_unauthenticated_cannot_create(self, api_client, expedient):
        data = {
            'title': 'No Auth',
            'asinged_to': expedient.asinged_to_id,
        }
        response = api_client.post('/api/expedients/', data)
        assert response.status_code == 401


class TestRequestCreate:
    def test_admin_can_request(self, admin_client, admin_user, analyst_user):
        response = admin_client.post('/api/expedients/request_create/', {
            'person_name': 'Juan Perez',
            'description': 'Necesita expediente',
        })
        assert response.status_code == 200
        assert Notification.objects.filter(notification_type='revision',
                                           title='Solicitud de Expediente').exists()

    def test_analyst_cannot_request(self, analyst_client):
        response = analyst_client.post('/api/expedients/request_create/', {
            'person_name': 'Test',
        })
        assert response.status_code == 403

    def test_request_missing_name(self, admin_client):
        response = admin_client.post('/api/expedients/request_create/', {
            'description': 'No name',
        })
        assert response.status_code == 400


class TestReassign:
    def test_admin_reassigns(self, admin_client, expedient, recepcionista_user):
        new_recep = UsersCustom.objects.create_user(
            username='recepcionista2', email='r2@test.com', password='test123',
            rol='recepcionista', cedula='11111111',
        )
        response = admin_client.post(f'/api/expedients/{expedient.id}/reassign/', {
            'asinged_to': new_recep.id,
        })
        assert response.status_code == 200
        expedient.refresh_from_db()
        assert expedient.asinged_to_id == new_recep.id

    def test_analyst_reassigns(self, analyst_client, expedient, recepcionista_user):
        new_recep = UsersCustom.objects.create_user(
            username='recepcionista3', email='r3@test.com', password='test123',
            rol='recepcionista', cedula='22222222',
        )
        response = analyst_client.post(f'/api/expedients/{expedient.id}/reassign/', {
            'asinged_to': new_recep.id,
        })
        assert response.status_code == 200

    def test_recepcionista_cannot_reassign(self, recepcionista_client, expedient):
        response = recepcionista_client.post(f'/api/expedients/{expedient.id}/reassign/', {
            'asinged_to': 999,
        })
        assert response.status_code == 403

    def test_reassign_nonexistent_user(self, admin_client, expedient):
        response = admin_client.post(f'/api/expedients/{expedient.id}/reassign/', {
            'asinged_to': 99999,
        })
        assert response.status_code == 400

    def test_reassign_no_user_id(self, admin_client, expedient):
        response = admin_client.post(f'/api/expedients/{expedient.id}/reassign/', {})
        assert response.status_code == 400


class TestPendingDocs:
    def test_admin_sees_pending(self, admin_client, document_in_aprobado):
        response = admin_client.get('/api/expedients/pending_docs/')
        assert response.status_code == 200
        ids = [d['id'] for d in response.data]
        assert document_in_aprobado.id in ids

    def test_recepcionista_blocked(self, recepcionista_client):
        response = recepcionista_client.get('/api/expedients/pending_docs/')
        assert response.status_code == 403


class TestSendToReview:
    def test_send_to_review_ok(self, admin_client, expedient, document_type_required, pdf_file):
        from documents.models import Document
        Document.objects.create(
            title='Req Doc', file=pdf_file, expedient=expedient,
            document_type=document_type_required, uploaded_by=expedient.asinged_to,
        )
        response = admin_client.post(f'/api/expedients/{expedient.id}/send_to_review/')
        assert response.status_code == 200
        expedient.refresh_from_db()
        assert expedient.is_draft is False
        assert expedient.status == 'Pendiente'

    def test_send_to_review_missing_docs(self, admin_client, expedient):
        response = admin_client.post(f'/api/expedients/{expedient.id}/send_to_review/')
        assert response.status_code == 400
        assert 'missing_documents' in response.data

    def test_recepcionista_send_own(self, recepcionista_client, expedient, document_type_required, pdf_file):
        from documents.models import Document
        Document.objects.create(
            title='Req Doc', file=pdf_file, expedient=expedient,
            document_type=document_type_required, uploaded_by=expedient.asinged_to,
        )
        response = recepcionista_client.post(f'/api/expedients/{expedient.id}/send_to_review/')
        assert response.status_code == 200


class TestSaveDraft:
    def test_save_draft(self, admin_client, expedient):
        expedient.is_draft = False
        expedient.save()
        response = admin_client.post(f'/api/expedients/{expedient.id}/save_draft/')
        assert response.status_code == 200
        expedient.refresh_from_db()
        assert expedient.is_draft is True


class TestApproveWorkflow:
    def test_analyst_pre_approves(self, analyst_client, expedient):
        expedient.is_draft = False
        expedient.save()
        response = analyst_client.post(f'/api/expedients/{expedient.id}/approve/')
        assert response.status_code == 200
        expedient.refresh_from_db()
        assert expedient.status == 'Pre_Aprobado'
        assert expedient.approved_by_id is not None

    def test_admin_final_approve(self, admin_client, expedient_pre_aprobado):
        response = admin_client.post(f'/api/expedients/{expedient_pre_aprobado.id}/admin_approve/')
        assert response.status_code == 200
        expedient_pre_aprobado.refresh_from_db()
        assert expedient_pre_aprobado.status == 'Aprobado'

    def test_approve_wrong_status(self, analyst_client, expedient):
        response = analyst_client.post(f'/api/expedients/{expedient.id}/approve/')
        # expedient is still is_draft=True by default
        assert response.status_code == 400

    def test_reject(self, admin_client, expedient):
        expedient.is_draft = False
        expedient.save()
        response = admin_client.post(f'/api/expedients/{expedient.id}/reject/', {
            'observation': 'Missing documents',
        })
        assert response.status_code == 200
        expedient.refresh_from_db()
        assert expedient.status == 'Rechazado'


class TestListAndFilters:
    def test_list_expedients(self, admin_client, expedient):
        response = admin_client.get('/api/expedients/')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_my_filter_recepcionista(self, recepcionista_client, expedient):
        response = recepcionista_client.get('/api/expedients/my/')
        assert response.status_code == 200
        assert any(e['id'] == expedient.id for e in response.data)

    def test_my_drafts(self, recepcionista_client, expedient):
        response = recepcionista_client.get('/api/expedients/my_drafts/')
        assert response.status_code == 200
        assert any(e['id'] == expedient.id for e in response.data)

    def test_pending_admin(self, admin_client, expedient_pre_aprobado):
        expedient_pre_aprobado.status = 'Pre_Aprobado'
        expedient_pre_aprobado.is_draft = False
        expedient_pre_aprobado.save()
        response = admin_client.get('/api/expedients/pending_admin/')
        assert response.status_code == 200
        assert any(e['id'] == expedient_pre_aprobado.id for e in response.data)

    def test_approved_list(self, admin_client, expedient_aprobado):
        response = admin_client.get('/api/expedients/approved/')
        assert response.status_code == 200
        assert any(e['id'] == expedient_aprobado.id for e in response.data)


class TestCorrectionsNeeded:
    def test_recepcionista_sees_corrections(self, recepcionista_client, document_rejected):
        response = recepcionista_client.get('/api/expedients/corrections_needed/')
        assert response.status_code == 200
        assert any(d['id'] == document_rejected.id for d in response.data)

    def test_analyst_gets_empty(self, analyst_client):
        response = analyst_client.get('/api/expedients/corrections_needed/')
        assert response.status_code == 200
        assert response.data == []


class TestPermissions:
    def test_destroy_admin_only(self, admin_client, expedient):
        response = admin_client.delete(f'/api/expedients/{expedient.id}/')
        assert response.status_code == 204

    def test_destroy_analyst_denied(self, analyst_client, expedient):
        response = analyst_client.delete(f'/api/expedients/{expedient.id}/')
        assert response.status_code == 403

    def test_update_logs_activity(self, admin_client, expedient):
        response = admin_client.patch(f'/api/expedients/{expedient.id}/', {
            'title': 'Updated Title',
        })
        assert response.status_code == 200
        from notifications.models import ActivityLog
        assert ActivityLog.objects.filter(action='Editó expediente').exists()
