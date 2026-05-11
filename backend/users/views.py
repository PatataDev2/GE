from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserSerializer, RegisterSerializer, RoleSerializer, UserUpdateRoleSerializer, AdminUserCreateSerializer
from .models import UsersCustom, Role
from .permissions import IsAdminUser


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class RegisterView(generics.CreateAPIView):
    queryset = UsersCustom.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        return token
    
class Custom_token_obtain_pair_view(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Create your views here.
class UserView(viewsets.ModelViewSet):
    serializer_class=UserSerializer
    queryset=UsersCustom.objects.all()
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

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]

class UserRoleUpdateView(generics.UpdateAPIView):
    serializer_class = UserUpdateRoleSerializer
    queryset = UsersCustom.objects.all()
    permission_classes = [IsAdminUser]
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        if user == request.user:
            return Response(
                {"error": "No puedes modificar tu propio rol"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        role_id = request.data.get('role')
        if role_id:
            try:
                old_role = user.role.name if user.role else 'sin rol'
                role = Role.objects.get(id=role_id)
                user.role = role
                user.save()

                from notifications.utils import create_activity_log
                create_activity_log(
                    user=request.user,
                    action='Cambió rol',
                    action_type='edit',
                    target=f'{user.username} → {role.name}',
                    ip_address=request.META.get('REMOTE_ADDR'),
                )

                return Response(
                    UserSerializer(user).data, 
                    status=status.HTTP_200_OK
                )
            except Role.DoesNotExist:
                return Response(
                    {"error": "Rol no encontrado"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {"error": "Se requiere un rol válido"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class AdminUserCreateView(generics.CreateAPIView):
    queryset = UsersCustom.objects.all()
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        user = serializer.save()
        from notifications.utils import create_activity_log
        create_activity_log(
            user=self.request.user,
            action='Creó usuario',
            action_type='create',
            target=user.username,
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from notifications.models import Notification
        from expedients.models import Expedient

        total_users = UsersCustom.objects.count()
        active_users = UsersCustom.objects.filter(is_active=True).count()

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

