from django.contrib.auth.backends import ModelBackend


class CuentaActivaBackend(ModelBackend):
    def user_can_authenticate(self, user):
        return getattr(user, 'cuenta_activa', False)
