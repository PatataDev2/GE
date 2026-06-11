import pytest
from users.models import UsersCustom

pytestmark = pytest.mark.django_db


class TestAuth:
    def test_login_cookie_success(self, api_client, recepcionista_user):
        response = api_client.post('/users/api/v1/login/cookie/', {
            'username': 'test_recepcionista',
            'password': 'testpass123',
        })
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.cookies.get('access_token') is not None

    def test_login_invalid_credentials(self, api_client):
        response = api_client.post('/users/api/v1/login/cookie/', {
            'username': 'nonexistent',
            'password': 'wrong',
        })
        assert response.status_code == 401

    def test_login_missing_fields(self, api_client):
        response = api_client.post('/users/api/v1/login/cookie/', {})
        assert response.status_code == 400

    def test_me_authenticated(self, admin_client, admin_user):
        response = admin_client.get('/users/api/v1/me/')
        assert response.status_code == 200
        assert response.data['username'] == admin_user.username

    def test_me_unauthenticated(self, api_client):
        response = api_client.get('/users/api/v1/me/')
        assert response.status_code == 401

    def test_logout(self, admin_client):
        response = admin_client.post('/users/api/v1/logout/')
        assert response.status_code == 200


class TestAdminUserManagement:
    def test_admin_list_users(self, admin_client, recepcionista_user, analyst_user):
        response = admin_client.get('/users/api/v1/')
        assert response.status_code == 200
        data = response.data
        if isinstance(data, dict):
            data = data.get('results', [])
        usernames = [u['username'] for u in data]
        assert 'test_recepcionista' in usernames
        assert 'test_analyst' in usernames
        assert 'test_admin' in usernames

    def test_recepcionista_only_sees_self(self, recepcionista_client, recepcionista_user):
        response = recepcionista_client.get('/users/api/v1/')
        assert response.status_code == 200
        data = response.data
        if isinstance(data, dict):
            data = data.get('results', [])
        assert len(data) == 1
        assert data[0]['username'] == 'test_recepcionista'

    def test_admin_creates_funcionario(self, admin_client):
        response = admin_client.post('/users/api/v1/admin/create-funcionario/', {
            'username': 'newemployee',
            'email': 'new@test.com',
            'password': 'NewPass123!',
            'password2': 'NewPass123!',
            'cedula': '99999999',
            'first_name': 'New',
            'last_name': 'Employee',
            'rol': 'recepcionista',
        })
        assert response.status_code == 201
        assert UsersCustom.objects.filter(username='newemployee').exists()

    def test_change_password(self, admin_client, admin_user):
        response = admin_client.post('/users/api/v1/change-password/', {
            'old_password': 'testpass123',
            'new_password': 'newpass456',
            'new_password2': 'newpass456',
        })
        assert response.status_code == 200
        admin_user.refresh_from_db()
        assert admin_user.check_password('newpass456')

    def test_change_password_wrong_old(self, admin_client, admin_user):
        response = admin_client.post('/users/api/v1/change-password/', {
            'old_password': 'wrongpassword',
            'new_password': 'newpass456',
            'new_password2': 'newpass456',
        })
        assert response.status_code == 400
