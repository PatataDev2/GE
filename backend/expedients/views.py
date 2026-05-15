from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Expedient
from .serializers import ExpedientSerializer
from documents.models import Document
from document_types.models import DocumentType
from notifications.utils import create_notification, create_activity_log

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
        
        from users.models import UsersCustom
        analysts = UsersCustom.objects.filter(role__name='analyst')
        for analyst in analysts:
            create_notification(
                recipient=analyst,
                actor=user,
                notification_type='revision',
                title='Expediente en Revision',
                message=f'El trabajador {user.username} ha enviado el expediente "{expedient.title}" para revision.',
                expedient_id=expedient.id,
            )
        
        create_activity_log(
            user=user,
            action='Envió expediente a revisión',
            action_type='edit',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        
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

        create_activity_log(
            user=user,
            action='Guardó expediente como borrador',
            action_type='edit',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        
        return Response({
            'success': True,
            'message': 'Expediente guardado como borrador',
            'expedient': ExpedientSerializer(expedient).data
        })

    def perform_update(self, serializer):
        expedient = serializer.save()
        create_activity_log(
            user=self.request.user,
            action='Editó expediente',
            action_type='edit',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

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
        expedient = serializer.save()
        employee = expedient.asinged_to
        create_notification(
            recipient=employee,
            actor=self.request.user,
            notification_type='asignado',
            title='Expediente Asignado',
            message=f'Se te ha asignado el expediente "{expedient.title}" para su gestion.',
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=self.request.user,
            action='Creó expediente',
            action_type='create',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Analista pre-aprueba el expediente, lo envia a admin para aprobacion final"""
        expedient = self.get_object()
        expedient.status = 'Pre_Aprobado'
        expedient.approved_by = request.user
        expedient.save(update_fields=['status', 'approved_by', 'updated_at'])
        from users.models import UsersCustom
        admins = UsersCustom.objects.filter(role__name='admin')
        for admin in admins:
            create_notification(
                recipient=admin,
                actor=request.user,
                notification_type='revision',
                title='Expediente Pre-Aprobado',
                message=f'El analista {request.user.username} ha pre-aprobado el expediente "{expedient.title}" y espera tu aprobacion final.',
                expedient_id=expedient.id,
            )
        create_activity_log(
            user=request.user,
            action='Pre-aprobó expediente',
            action_type='approve',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'expediente pre-aprobado, pendiente de aprobacion del admin', 'id': expedient.id})

    @action(detail=True, methods=['post'])
    def admin_approve(self, request, pk=None):
        """Admin da la aprobacion final al expediente"""
        expedient = self.get_object()
        if request.user.role.name != 'admin':
            return Response({'error': 'Solo administradores pueden dar la aprobacion final'}, status=status.HTTP_403_FORBIDDEN)
        expedient.status = 'Aprobado'
        expedient.approved_by = request.user
        expedient.save(update_fields=['status', 'approved_by', 'updated_at'])
        create_notification(
            recipient=expedient.asinged_to,
            actor=request.user,
            notification_type='aprobado',
            title='Expediente Aprobado',
            message=f'Tu expediente "{expedient.title}" ha sido aprobado definitivamente por el administrador.',
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=request.user,
            action='Aprobó expediente',
            action_type='approve',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'expediente aprobado definitivamente', 'id': expedient.id})

    @action(detail=False, methods=['get'])
    def pending_admin(self, request):
        """Lista expedientes pre-aprobados pendientes de aprobacion del admin"""
        if request.user.role.name != 'admin':
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        expedients = Expedient.objects.filter(status='Pre_Aprobado', is_draft=False)
        serializer = self.get_serializer(expedients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def approved(self, request):
        """Lista expedientes aprobados definitivamente"""
        if request.user.role.name not in ['admin', 'analyst']:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        expedients = Expedient.objects.filter(status='Aprobado', is_draft=False).order_by('-updated_at')
        serializer = self.get_serializer(expedients, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        expedient = self.get_object()
        expedient.status = 'Rechazado'
        expedient.save(update_fields=['status'])
        correcciones = request.data.get('correcciones', request.data.get('observation', ''))
        mensaje = f'Tu expediente "{expedient.title}" ha sido rechazado.'
        if correcciones:
            mensaje += f' Correcciones requeridas: {correcciones}'
        else:
            mensaje += ' Revisa las observaciones.'
        create_notification(
            recipient=expedient.asinged_to,
            actor=request.user,
            notification_type='rechazado',
            title='Expediente Rechazado',
            message=mensaje,
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=request.user,
            action='Rechazó expediente',
            action_type='reject',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'expediente rechazado', 'id': expedient.id})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        create_activity_log(
            user=request.user,
            action='Eliminó expediente',
            action_type='delete',
            target=f'#{instance.id} - {instance.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        self.perform_destroy(instance)
        return Response(
            {"message": "Expediente eliminado correctamente"}, 
            status=status.HTTP_204_NO_CONTENT
        )