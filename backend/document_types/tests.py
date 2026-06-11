from django.test import TestCase


class DocumentTypeTestCase(TestCase):
    def test_document_type_creation(self):
        from .models import DocumentType
        doc_type = DocumentType.objects.create(
            name="Test Document",
            description="Test description"
        )
        self.assertEqual(doc_type.name, "Test Document")
        self.assertTrue(doc_type.is_active)
        self.assertIsNotNone(doc_type.created_at)


import pytest


@pytest.mark.django_db
class TestDocumentTypeAPI:
    def test_list_types(self, admin_client):
        response = admin_client.get('/api/document-types/')
        assert response.status_code == 200
        assert len(response.data) >= 0

    def test_create_type(self, admin_client):
        response = admin_client.post('/api/document-types/', {
            'name': 'New Type API',
            'description': 'Created via API',
            'is_required': True,
        })
        assert response.status_code == 201
        from document_types.models import DocumentType
        assert DocumentType.objects.filter(name='New Type API').exists()

    def test_unauthenticated_cannot_create(self, api_client):
        response = api_client.post('/api/document-types/', {
            'name': 'Should Fail',
        })
        assert response.status_code in (401, 403)
