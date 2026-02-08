from django.shortcuts import render
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
                role = Role.objects.get(id=role_id)
                user.role = role
                user.save()
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

