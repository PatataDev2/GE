from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado:
    - Cualquier usuario autenticado puede ver (GET, HEAD, OPTIONS).
    - Solo administradores pueden realizar acciones de escritura/borrado.
    """
    def has_permission(self, request, view):
        # Si la acción es de lectura, permitimos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Si es borrar o editar, verificamos si es admin
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == 'admin'
        )

class IsAdminToDelete(permissions.BasePermission):
    """
    Permiso específico: Solo permite el método DELETE si es admin.
    """
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return bool(request.user.role and request.user.role.name == 'admin')
        return True