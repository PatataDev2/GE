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