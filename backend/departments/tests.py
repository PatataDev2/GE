from django.test import TestCase


class DepartmentModelTest(TestCase):
    def test_department_creation(self):
        """
        Test that a department can be created with all fields
        """
        from departments.models import Department

        department = Department.objects.create(
            name='Test Department',
            description='Test Description'
        )

        self.assertEqual(department.name, 'Test Department')
        self.assertEqual(department.description, 'Test Description')
        self.assertTrue(department.is_active)
        self.assertIsNotNone(department.created_at)
        self.assertIsNotNone(department.updated_at)

    def test_department_str_method(self):
        """
        Test the __str__ method returns the department name
        """
        from departments.models import Department

        department = Department.objects.create(name='Test Department')
        self.assertEqual(str(department), 'Test Department')


import pytest


@pytest.mark.django_db
class TestDepartmentAPI:
    def test_list_departments(self, admin_client):
        response = admin_client.get('/api/departments/')
        assert response.status_code == 200
        assert len(response.data) >= 0

    def test_create_department(self, admin_client):
        response = admin_client.post('/api/departments/', {
            'name': 'New Dept API',
            'description': 'Created via API',
        })
        assert response.status_code == 201
        from departments.models import Department
        assert Department.objects.filter(name='New Dept API').exists()

    def test_unauthenticated_cannot_create(self, api_client):
        response = api_client.post('/api/departments/', {
            'name': 'Should Fail',
        })
        assert response.status_code in (401, 403)
