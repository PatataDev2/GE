from rest_framework import serializers
from .models import Expedient
from users.models import UsersCustom # Importante para el queryset
from users.serializers import UserSerializer

class ExpedientSerializer(serializers.ModelSerializer):
    # Esto muestra la info detallada en los GET
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    asinged_to_username = serializers.CharField(source='asinged_to.username', read_only=True, allow_null=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    # SOLUCIÓN: Sobrescribimos el campo para que busque en TODOS los usuarios
    # y así permita que el flujo llegue a 'validate_asinged_to' para mostrar los logs.
    asinged_to = serializers.PrimaryKeyRelatedField(
        queryset=UsersCustom.objects.all()
    )

    class Meta:
        model = Expedient
        fields = [
        'id', 
        'title', 
        'description', 
        'department',
        'status', 
        'is_draft',
        'asinged_to',
        'department_name',
        'asinged_to_username',
        'approved_by_username',
        'created_by',
        'created_by_username',
        'created_at', 
        'updated_at'
            ]
        read_only_fields = ['created_at', 'updated_at', 'approved_by', 'rejected_by', 'created_by']

    def validate_asinged_to(self, value):
        role_name = value.rol

        if role_name != 'recepcionista':
            raise serializers.ValidationError(
                f"Este usuario tiene el rol '{role_name}'. Solo se pueden asignar expedientes a 'recepcionista'."
            )
        return value