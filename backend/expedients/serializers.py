from rest_framework import serializers
from .models import Expedient
from users.models import UsersCustom # Importante para el queryset
from users.serializers import UserSerializer

class ExpedientSerializer(serializers.ModelSerializer):
    # Esto muestra la info detallada en los GET
    asinged_to_data = UserSerializer(source='asinged_to', read_only=True)

    # SOLUCIÓN: Sobreescribimos el campo para que busque en TODOS los usuarios
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
            'status', 
            'asinged_to',      # Entrada (ID)
            'asinged_to_data', # Salida (Objeto)
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_asinged_to(self, value):
        """
        Validación manual con logs para depuración en consola.
        """
        print("\n--- DEBUG: VALIDANDO ASIGNACIÓN ---")
        print(f"Usuario enviado: {value.username} (ID: {value.id})")
        
        # Obtenemos el nombre del rol de forma segura
        role_name = value.role.name if value.role else "SIN ROL"
        print(f"Rol detectado en base de datos: '{role_name}'")
        
        if role_name != 'employee':
            print(f"RESULTADO: Rechazado. '{role_name}' no es igual a 'employee'")
            raise serializers.ValidationError(
                f"Este usuario tiene el rol '{role_name}'. Solo se pueden asignar expedientes a 'employee'."
            )
        
        print("RESULTADO: Validación exitosa.")
        print("-----------------------------------\n")
        return value