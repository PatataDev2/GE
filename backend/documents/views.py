from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
      
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.role:
            return Document.objects.none()

        if user.role.name in ['admin', 'analyst']:
            queryset = Document.objects.all()
        else:
            queryset = Document.objects.filter(expedient__asinged_to=user)
        
        expedient_id = self.request.query_params.get('expedient')
        if expedient_id:
            queryset = queryset.filter(expedient_id=expedient_id)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if 'approval_status' in request.data and request.user.role.name == 'employee':
            return Response(
                {"error": "Los trabajadores no pueden aprobar documentos."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def replace_file(self, request, pk=None):
        """Reemplaza el archivo de un documento rechazado y lo vuelve a pendiente"""
        document = self.get_object()
        user = request.user
        
        if user.role.name != 'employee':
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
        
        if document.expedient.asinged_to != user:
            return Response({'error': 'Este documento no te pertenece'}, status=status.HTTP_403_FORBIDDEN)
        
        if document.approval_status is not False:
            return Response({'error': 'Solo se pueden reemplazar documentos rechazados'}, status=status.HTTP_400_BAD_REQUEST)
        
        if 'file' not in request.data:
            return Response({'error': 'Debes proporcionar un archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_file_path = document.file.path if document.file else None
        
        document.file = request.data['file']
        document.approval_status = None
        document.description_state = 'pendiente'
        document.description_corrections = ''
        document.save()
        
        if old_file_path:
            import os
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        from .serializers import DocumentSerializer
        return Response({
            'message': 'Archivo reemplazado exitosamente',
            'document': DocumentSerializer(document).data
        })

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        document = self.get_object()
        
        if request.user.role.name == 'employee':
            return Response(
                {"error": "No tienes permiso para revisar documentos."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        action_type = request.data.get('action')
        message = request.data.get('message', '')
        
        if action_type not in ['approve', 'reject']:
            return Response(
                {"error": "Acción inválida. Use 'approve' o 'reject'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action_type == 'approve':
            document.approval_status = True
            document.description_state = 'aprobado'
            document.description_content = message
        else:
            document.approval_status = False
            document.description_state = 'rechazado'
            document.description_content = message
            if request.data.get('corrections'):
                document.description_corrections = request.data['corrections']
        
        document.save()
        
        return Response({
            'id': document.id,
            'title': document.title,
            'approval_status': document.approval_status,
            'description_state': document.description_state,
            'description_content': document.description_content
        })