from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import UsersCustom
from .permissions import IsAdminUser
from .serializers import (
    AdminCreateFuncionarioSerializer,
    AdminUpdateFuncionarioSerializer,
    RegisterSerializer,
    UserSerializer,
)


class UserPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 500


class RegisterView(generics.CreateAPIView):
    queryset = UsersCustom.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        return token


class Custom_token_obtain_pair_view(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access = response.data.get('access')
            refresh = response.data.get('refresh')
            secure = not settings.DEBUG
            response.set_cookie(
                'access_token', access,
                max_age=timedelta(hours=1).total_seconds(),
                httponly=True, secure=secure, samesite='Lax', path='/',
            )
            response.set_cookie(
                'refresh_token', refresh,
                max_age=timedelta(days=1).total_seconds(),
                httponly=True, secure=secure, samesite='Lax', path='/',
            )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        if not request.data.get('refresh'):
            refresh = request.COOKIES.get('refresh_token')
            if refresh:
                request.data['refresh'] = refresh
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and 'access' in response.data:
            secure = not settings.DEBUG
            response.set_cookie(
                'access_token', response.data['access'],
                max_age=timedelta(hours=1).total_seconds(),
                httponly=True, secure=secure, samesite='Lax', path='/',
            )
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response({'message': 'Sesión cerrada exitosamente'})
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response


class UserView(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = UserPagination

    def get_queryset(self):
        user = self.request.user
        if user.rol in ['admin', 'analyst']:
            return UsersCustom.objects.all()
        return UsersCustom.objects.filter(id=user.id)

    def perform_destroy(self, instance):
        from notifications.utils import create_activity_log
        create_activity_log(
            user=self.request.user,
            action='Eliminó usuario',
            action_type='delete',
            target=instance.username,
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        instance.delete()


class AdminCreateFuncionarioView(generics.CreateAPIView):
    queryset = UsersCustom.objects.all()
    serializer_class = AdminCreateFuncionarioSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        data = UserSerializer(user).data
        return Response(data, status=status.HTTP_201_CREATED)


class AdminUpdateFuncionarioView(generics.UpdateAPIView):
    queryset = UsersCustom.objects.all()
    serializer_class = AdminUpdateFuncionarioSerializer
    permission_classes = [IsAdminUser]


class AdminToggleActivoView(generics.UpdateAPIView):
    queryset = UsersCustom.objects.all()
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        user.cuenta_activa = not user.cuenta_activa
        user.is_active = user.cuenta_activa
        user.save()
        return Response({'cuenta_activa': user.cuenta_activa})


class AdminResetPasswordView(generics.UpdateAPIView):
    queryset = UsersCustom.objects.all()
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        import secrets
        user = self.get_object()
        password = secrets.token_hex(6)
        user.set_password(password)
        user.clave_temporal = True
        user.save()
        return Response({'message': 'Contraseña restablecida exitosamente. El usuario debe cambiar su contraseña en el próximo inicio de sesión.'})


class ChangePasswordView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        user = request.user
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password')
        new_password2 = request.data.get('new_password2')

        if not user.check_password(old_password):
            return Response({'error': 'La contraseña actual es incorrecta'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password:
            return Response({'error': 'La nueva contraseña es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != new_password2:
            return Response({'error': 'Las contraseñas no coinciden'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.clave_temporal = False
        user.save()
        return Response({'message': 'Contraseña cambiada exitosamente'})


class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from expedients.models import Expedient
        from notifications.models import Notification

        total_users = UsersCustom.objects.count()
        active_users = UsersCustom.objects.filter(cuenta_activa=True).count()

        today = timezone.now().date()
        today_actions = Notification.objects.filter(created_at__date=today).count()

        recent_activity = Notification.objects.select_related('actor').all()[:10]
        activity_data = [{
            'id': n.id,
            'actor_username': n.actor.username if n.actor else 'Sistema',
            'notification_type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'expedient_id': n.expedient_id,
            'created_at': n.created_at.isoformat(),
        } for n in recent_activity]

        total_exp = Expedient.objects.count()
        pending = Expedient.objects.filter(status='Pendiente').count()
        approved = Expedient.objects.filter(status__in=['Aprobado', 'Finalizado']).count()
        rejected = Expedient.objects.filter(status='Rechazado').count()

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'today_actions': today_actions,
            'recent_activity': activity_data,
            'expedients_summary': {
                'total': total_exp,
                'pending': pending,
                'approved': approved,
                'rejected': rejected,
            }
        })
