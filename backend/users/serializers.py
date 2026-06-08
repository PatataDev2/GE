from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import UsersCustom


class UserSerializer(serializers.ModelSerializer):
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = UsersCustom
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'cedula', 'phone',
            'rol', 'rol_display', 'clave_temporal', 'cuenta_activa',
            'is_staff', 'is_active', 'date_joined'
        ]


class AdminCreateFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsersCustom
        fields = ('cedula', 'first_name', 'last_name', 'email', 'rol')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate_cedula(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("La cédula debe contener solo números")
        if len(value) < 7 or len(value) > 8:
            raise serializers.ValidationError("La cédula debe tener entre 7 y 8 dígitos")
        if UsersCustom.objects.filter(cedula=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con esta cédula")
        return value

    def create(self, validated_data):
        import secrets

        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')

        password = secrets.token_hex(6)

        base_username = (first_name + last_name).lower().replace(' ', '')
        username = base_username
        suffix = 1
        while UsersCustom.objects.filter(username=username).exists():
            username = f"{base_username}{suffix}"
            suffix += 1

        user = UsersCustom.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=validated_data.get('email'),
            cedula=validated_data.get('cedula'),
            rol=validated_data.get('rol', 'recepcionista'),
            clave_temporal=True,
            cuenta_activa=True,
            is_active=True,
        )
        user.set_password(password)
        user.save()

        self._generated_password = password
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = UsersCustom
        fields = ('email', 'username', 'password', 'password2', 'cedula', 'phone', 'first_name', 'last_name')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = UsersCustom.objects.create(
            username=validated_data.get('username'),
            email=validated_data.get('email'),
            cedula=validated_data.get('cedula'),
            phone=validated_data.get('phone', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            rol='recepcionista',
            clave_temporal=False,
            cuenta_activa=True,
            is_active=True,
        )
        user.set_password(password)
        user.save()
        return user


class AdminUpdateFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsersCustom
        fields = ('first_name', 'last_name', 'email', 'rol')
