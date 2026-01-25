from rest_framework import serializers
from .models import UsersCustom
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
        user = UsersCustom(**validated_data)
        user.set_password(password)  # encriptamos la contraseña
        user.save()
        return user
        

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = UsersCustom