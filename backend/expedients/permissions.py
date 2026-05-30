from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado:
    - Cualquier usuario autenticado puede ver (GET, HEAD, OPTIONS).
    - Solo administradores pueden realizar acciones de escritura/borrado.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'admin'
        )

class IsAdminToDelete(permissions.BasePermission):
    """
    Permiso específico: Solo permite el método DELETE si es admin.
    """
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return request.user.is_authenticated and request.user.rol == 'admin'
        return True