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