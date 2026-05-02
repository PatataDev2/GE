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
            return Document.objects.all()
        
        return Document.objects.filter(expedient__asinged_to=user)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if 'approval_status' in request.data and request.user.role.name == 'employee':
            return Response(
                {"error": "Los empleados no pueden aprobar documentos."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

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
        
        document.save()
        
        return Response({
            'id': document.id,
            'title': document.title,
            'approval_status': document.approval_status,
            'description_state': document.description_state,
            'description_content': document.description_content
        })