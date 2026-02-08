from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    # Importante para que Django entienda la subida de archivos físicos
    parser_classes = (MultiPartParser, FormParser)
     
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.role:
            return Document.objects.none()

        # Admin y Analista: Ven todos los documentos
        if user.role.name in ['admin', 'analyst']:
            return Document.objects.all()
        
        # Empleado: Solo ve los documentos de sus propios expedientes
        return Document.objects.filter(expedient__asinged_to=user)

    def perform_create(self, serializer):
        # Asignamos automáticamente el usuario que sube el archivo
        serializer.save(uploaded_by=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Bloqueo de seguridad: Solo Admin o Analista pueden cambiar el approval_status.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Si un empleado intenta cambiar el estatus de aprobación
        if 'approval_status' in request.data and request.user.role.name == 'employee':
            return Response(
                {"error": "Los empleados no pueden aprobar documentos."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)