from rest_framework import serializers
from .models import UsersCustom, Role
from django.contrib.auth.password_validation import validate_password


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta: 
        model = UsersCustom
        fields = ('email', 'username', 'password', 'password2', 'cedula', 'phone')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')  # eliminamos password2 porque no se guarda
        password = validated_data.pop('password')  # sacamos password para usar set_password
        
        # Asignar rol de usuario normal por defecto
        from .models import Role
        user_role = Role.objects.get(name='user')
        validated_data['role'] = user_role
        
        user = UsersCustom(**validated_data)
        user.set_password(password)  # encriptamos la contraseña
        user.save()
        return user
        

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())
    
    class Meta:
        model = UsersCustom
        fields = ['id', 'username', 'email', 'cedula', 'phone', 'role', 'role_name', 'is_staff', 'is_active', 'date_joined']

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
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = UsersCustom(**validated_data)
        user.set_password(password)
        user.save()
        return user