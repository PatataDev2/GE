from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Expedient
from .serializers import ExpedientSerializer
from documents.models import Document
from document_types.models import DocumentType

class ExpedientViewSet(viewsets.ModelViewSet):
    queryset = Expedient.objects.all()
    serializer_class = ExpedientSerializer

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Obtiene los expedients asignados al usuario actual (incluye borradores)"""
        user = request.user
        if user.role.name == 'employee':
            expedients = Expedient.objects.filter(asinged_to=user)
        else:
            expedients = Expedient.objects.none()
        serializer = self.get_serializer(expedients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_drafts(self, request):
        """Obtiene los borradores del usuario actual"""
        user = request.user
        if user.role.name == 'employee':
            drafts = Expedient.objects.filter(asinged_to=user, is_draft=True)
        else:
            drafts = Expedient.objects.none()
        serializer = self.get_serializer(drafts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def corrections_needed(self, request):
        """Obtiene documentos rechazados con correcciones pendientes para el usuario"""
        user = request.user
        if user.role.name != 'employee':
            return Response([])
        
        docs = Document.objects.filter(
            expedient__asinged_to=user,
            approval_status=False
        ).select_related('expedient', 'document_type').order_by('-uploaded_at')
        
        result = []
        for doc in docs:
            result.append({
                'id': doc.id,
                'title': doc.title,
                'expedient_id': doc.expedient.id,
                'expedient_title': doc.expedient.title,
                'document_type': doc.document_type.name if doc.document_type else 'Sin tipo',
                'corrections': doc.description_corrections or '',
                'uploaded_at': doc.uploaded_at.isoformat(),
            })
        return Response(result)

    @action(detail=True, methods=['post'])
    def send_to_review(self, request, pk=None):
        """Envia un borrador a revision verificando el checklist de documentos"""
        expedient = self.get_object()
        user = request.user
        
        if user.role.name != 'employee':
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
        
        if expedient.asinged_to != user:
            return Response({'error': 'Este expediente no te pertenece'}, status=status.HTTP_403_FORBIDDEN)
        
        if not expedient.is_draft:
            return Response({'error': 'Este expediente ya fue enviado a revision'}, status=status.HTTP_400_BAD_REQUEST)
        
        required_types = DocumentType.objects.filter(is_active=True, is_required=True)
        uploaded_type_ids = set(
            Document.objects.filter(expedient=expedient, document_type__isnull=False)
            .values_list('document_type_id', flat=True)
        )
        
        missing_types = []
        for rt in required_types:
            if rt.id not in uploaded_type_ids:
                missing_types.append({
                    'id': rt.id,
                    'name': rt.name,
                    'description': rt.description
                })
        
        if missing_types:
            return Response({
                'success': False,
                'message': 'Faltan documentos obligatorios',
                'missing_documents': missing_types
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expedient.is_draft = False
        expedient.status = 'Pendiente'
        expedient.save(update_fields=['is_draft', 'status', 'updated_at'])
        
        return Response({
            'success': True,
            'message': 'Expediente enviado a revision exitosamente',
            'expedient': ExpedientSerializer(expedient).data
        })

    @action(detail=True, methods=['post'])
    def save_draft(self, request, pk=None):
        """Marca un expediente como borrador"""
        expedient = self.get_object()
        user = request.user
        
        if user.role.name != 'employee':
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
        
        if expedient.asinged_to != user:
            return Response({'error': 'Este expediente no te pertenece'}, status=status.HTTP_403_FORBIDDEN)
        
        expedient.is_draft = True
        expedient.save(update_fields=['is_draft', 'updated_at'])
        
        return Response({
            'success': True,
            'message': 'Expediente guardado como borrador',
            'expedient': ExpedientSerializer(expedient).data
        })

    def get_permissions(self):
        if self.action == 'destroy':
            class IsAdminRole(permissions.BasePermission):
                def has_permission(self, request, view):
                    return bool(request.user.role and request.user.role.name == 'admin')
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.role:
            return Expedient.objects.none()
        if user.role.name in ['admin', 'analyst']:
            return Expedient.objects.filter(is_draft=False)
        if user.role.name == 'employee':
            return Expedient.objects.filter(asinged_to=user)
        return Expedient.objects.none()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expedient = self.get_object()
        expedient.status = 'Aprobado'
        expedient.save(update_fields=['status'])
        return Response({'status': 'expediente aprobado', 'id': expedient.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        expedient = self.get_object()
        expedient.status = 'Rechazado'
        expedient.save(update_fields=['status'])
        return Response({'status': 'expediente rechazado', 'id': expedient.id})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Expediente eliminado correctamente"}, 
            status=status.HTTP_204_NO_CONTENT
        )