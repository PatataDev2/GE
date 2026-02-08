# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import UsersCustom, Role 

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta: 
        model = UsersCustom
        fields = ('email', 'username', 'password', 'password2', 'cedula', 'phone')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        # Ajuste: Buscar o crear el rol 'user' (asegúrate que el slug coincida con tu modelo)
        user_role, _ = Role.objects.get_or_create(name='user')
        
        user = UsersCustom.objects.create_user(
            role=user_role,
            **validated_data
        )
        # Nota: create_user ya maneja set_password y save() automáticamente
        return user

class UserSerializer(serializers.ModelSerializer):
    # Mostramos el nombre legible del rol y el ID para poder editarlo
    role_name = serializers.CharField(source='role.name', read_only=True)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = UsersCustom
        fields = [
            'id', 'username', 'email', 'cedula', 'phone', 
            'role', 'role_name', 'is_staff', 'is_active', 'date_joined'
        ]

# ... El resto de serializadores (AdminUserCreateSerializer, etc.) pueden quedarse igual ...

class UsersCustomSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = UsersCustom
        fields = ['id', 'username', 'email', 'cedula', 'phone', 'role', 'role_name', 'first_name', 'last_name']
        
class UserUpdateRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsersCustom
        fields = ['role']

class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = UsersCustom
        fields = ('email', 'username', 'password', 'password2', 'cedula', 'phone', 'role')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = UsersCustom(**validated_data)
        user.set_password(password)
        user.save()
        return user