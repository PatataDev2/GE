from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Expedient
from .serializers import ExpedientSerializer

class ExpedientViewSet(viewsets.ModelViewSet):
    queryset = Expedient.objects.all()
    serializer_class = ExpedientSerializer

    def get_permissions(self):
        """
        Asigna permisos dinámicos según la acción:
        - Para borrar (destroy): Solo administradores.
        - Para el resto: Cualquier usuario autenticado (filtrado por get_queryset).
        """
        if self.action == 'destroy':
            # Creamos una clase de permiso al vuelo que verifique el rol admin
            class IsAdminRole(permissions.BasePermission):
                def has_permission(self, request, view):
                    return bool(request.user.role and request.user.role.name == 'admin')
            
            return [permissions.IsAuthenticated(), IsAdminRole()]
        
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        
        # Evitamos errores si el usuario no está autenticado o no tiene rol
        if not user.is_authenticated or not user.role:
            return Expedient.objects.none()

        # Admin y Analyst: Acceso total
        if user.role.name in ['admin', 'analyst']:
            return Expedient.objects.all()
        
        # Employee: Solo sus asignados
        if user.role.name == 'employee':
            return Expedient.objects.filter(asinged_to=user)
        
        return Expedient.objects.none()

    def perform_create(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """
        Opcional: Personalizamos la respuesta del borrado
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Expediente eliminado correctamente"}, 
            status=status.HTTP_204_NO_CONTENT
        )