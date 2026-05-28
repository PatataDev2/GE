from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserSerializer, RegisterSerializer, AdminCreateFuncionarioSerializer, AdminUpdateFuncionarioSerializer
from .models import UsersCustom
from .permissions import IsAdminUser


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


class UserView(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    queryset = UsersCustom.objects.all()
    permission_classes = [permissions.IsAuthenticated]

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
        password = getattr(serializer, '_generated_password', '')
        data = UserSerializer(user).data
        data['password'] = password
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
        return Response({'password': password})


class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from notifications.models import Notification
        from expedients.models import Expedient

        total_users = UsersCustom.objects.count()
        active_users = UsersCustom.objects.filter(cuenta_activa=True).count()

        today = timezone.now().date()
        today_actions = Notification.objects.filter(created_at__date=today).count()

        recent_activity = Notification.objects.all()[:10]
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
