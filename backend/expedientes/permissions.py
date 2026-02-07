from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a los creadores editar los recursos
    """
    
    def has_object_permission(self, request, view, obj):
        # Leer permisos siempre permitidos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin puede hacer todo
        if request.user.is_admin:
            return True
        
        # Solo el creador o el asignado pueden editar
        return obj.creado_por == request.user or obj.asignado_a == request.user

class CanManageExpediente(permissions.BasePermission):
    """
    Permiso para gestionar expedientes basado en rol
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin puede hacer todo
        if request.user.is_admin:
            return True
        
        # Analista y empleado pueden ver y crear
        if request.method in ['GET', 'POST', 'HEAD', 'OPTIONS']:
            return request.user.is_analyst or request.user.is_employee
        
        # Para otros métodos (PUT, DELETE), debe ser admin
        return request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Admin puede hacer todo
        if request.user.is_admin:
            return True
        
        # El asignado o creador puede ver y editar
        if request.method in permissions.SAFE_METHODS + ['PUT', 'PATCH']:
            return obj.asignado_a == request.user or obj.creado_por == request.user
        
        return False
