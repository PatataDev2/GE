import os

from django.db.models import Q
from django.utils.timezone import now
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from document_types.models import DocumentType
from documents.models import Document
from documents.serializers import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE,
    DocumentSerializer,
    validate_file_magic,
)
from notifications.utils import (
    bulk_create_notifications,
    create_activity_log,
    create_notification,
)
from users.models import UsersCustom

from .models import Expedient
from users.permissions import IsAdminUser
from .serializers import ExpedientSerializer


class ExpedientViewSet(viewsets.ModelViewSet):
    queryset = Expedient.objects.all()
    serializer_class = ExpedientSerializer
    pagination_class = None

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Obtiene los expedients asignados al usuario actual"""
        user = request.user
        if user.rol == 'recepcionista':
            expedients = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by').filter(asinged_to=user)
        elif user.rol in ['admin', 'analyst']:
            qs = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by')
            if user.rol == 'analyst':
                expedients = qs.filter(Q(created_by=user) | Q(is_draft=False))
            else:
                expedients = qs.all()
        else:
            expedients = Expedient.objects.none()
        serializer = self.get_serializer(expedients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_drafts(self, request):
        """Obtiene los borradores del usuario actual o de su responsabilidad"""
        user = request.user
        if user.rol == 'recepcionista':
            drafts = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by').filter(asinged_to=user, is_draft=True)
        elif user.rol in ['admin', 'analyst']:
            qs = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by').filter(is_draft=True)
            if user.rol == 'analyst':
                drafts = qs.filter(Q(created_by=user) | Q(asinged_to__isnull=False))
            else:
                drafts = qs.all()
        else:
            drafts = Expedient.objects.none()
        serializer = self.get_serializer(drafts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def request_create(self, request):
        """Admin solicita la creación de un expediente. Crea el expediente y notifica al recepcionista + analysts"""
        if request.user.rol != 'admin':
            return Response({'error': 'Solo administradores pueden solicitar creación'}, status=status.HTTP_403_FORBIDDEN)
        person_name = request.data.get('person_name', '')
        description = request.data.get('description', '')
        recepcionista_id = request.data.get('recepcionista_id')

        if not person_name:
            return Response({'error': 'Debes indicar el nombre de la persona'}, status=status.HTTP_400_BAD_REQUEST)
        if not recepcionista_id:
            return Response({'error': 'Debes seleccionar un recepcionista'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recepcionista = UsersCustom.objects.get(id=recepcionista_id, rol='recepcionista')
        except UsersCustom.DoesNotExist:
            return Response({'error': 'Recepcionista no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        expedient = Expedient.objects.create(
            title=person_name,
            description=description,
            asinged_to=recepcionista,
            created_by=request.user,
            status='Solicitado',
            is_draft=True,
        )

        create_notification(
            recipient=recepcionista,
            actor=request.user,
            notification_type='asignado',
            title='Nuevo Expediente Asignado',
            message=f'Se te ha asignado el expediente "{expedient.title}" para su gestión. Motivo: {description}',
            expedient_id=expedient.id,
        )
        analysts = UsersCustom.objects.filter(rol='analyst')
        bulk_create_notifications(
            recipients=analysts,
            actor=request.user,
            notification_type='revision',
            title='Solicitud de Expediente',
            message=f'El administrador ha creado un expediente para {person_name}. Asignado a {recepcionista.username}. Motivo: {description}',
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=request.user,
            action='Solicitó creación de expediente',
            action_type='create',
            target=f'#{expedient.id} - {person_name} → {recepcionista.username}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'expediente creado y notificado', 'expedient_id': expedient.id})

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def request_document_update(self, request):
        """Admin solicita actualizar documentos de un expediente existente.
        Recibe analyst_id y recepcionista_id para enviar notificaciones a ambos.
        """
        if request.user.rol != 'admin':
            return Response({'error': 'Solo administradores pueden solicitar actualización'}, status=status.HTTP_403_FORBIDDEN)

        expedient_id = request.data.get('expedient_id')
        description = request.data.get('description', '')
        analyst_id = request.data.get('analyst_id')
        recepcionista_id = request.data.get('recepcionista_id')

        if not expedient_id:
            return Response({'error': 'Debes seleccionar un expediente'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            expedient = Expedient.objects.get(id=expedient_id)
        except Expedient.DoesNotExist:
            return Response({'error': 'Expediente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        analyst = None
        recepcionista = None
        if analyst_id:
            try:
                analyst = UsersCustom.objects.get(id=analyst_id, rol='analyst')
            except UsersCustom.DoesNotExist:
                return Response({'error': 'Analista no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        if recepcionista_id:
            try:
                recepcionista = UsersCustom.objects.get(id=recepcionista_id, rol='recepcionista')
            except UsersCustom.DoesNotExist:
                return Response({'error': 'Recepcionista no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        files = request.FILES.getlist('files')
        replace_doc_ids = request.data.getlist('replace_document_ids')
        doc_titles = request.data.getlist('doc_titles')

        created_docs = []
        replaced_docs = []

        for i, f in enumerate(files):
            ext = os.path.splitext(f.name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                return Response({'error': f'Tipo de archivo no permitido: {f.name}'}, status=status.HTTP_400_BAD_REQUEST)
            if f.size > MAX_FILE_SIZE:
                return Response({'error': f'El archivo excede 10 MB: {f.name}'}, status=status.HTTP_400_BAD_REQUEST)
            detected = validate_file_magic(f)
            if detected is None or detected != ext:
                return Response({'error': f'El contenido no coincide con la extensión: {f.name}'}, status=status.HTTP_400_BAD_REQUEST)

            title = doc_titles[i] if i < len(doc_titles) and doc_titles[i] else f.name

            if i < len(replace_doc_ids) and replace_doc_ids[i] and replace_doc_ids[i] != 'null':
                try:
                    original_doc = Document.objects.get(id=replace_doc_ids[i], expedient=expedient)
                    old_path = original_doc.file.path if original_doc.file else None
                    original_doc.file = f
                    original_doc.title = title
                    original_doc.approval_status = None
                    original_doc.description_state = 'pendiente'
                    original_doc.description_corrections = ''
                    original_doc.save()
                    if old_path and os.path.exists(old_path):
                        os.remove(old_path)
                    replaced_docs.append(original_doc)
                except Document.DoesNotExist:
                    return Response({'error': f'Documento a reemplazar no encontrado: {replace_doc_ids[i]}'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                doc = Document.objects.create(
                    title=title,
                    file=f,
                    expedient=expedient,
                    uploaded_by=request.user,
                    approval_status=None,
                    description_state='pendiente',
                )
                created_docs.append(doc)

        total_docs = len(created_docs) + len(replaced_docs)

        msg_parts = [f'El administrador solicita actualizar documentos del expediente "{expedient.title}"']
        if created_docs:
            doc_names = ', '.join(f'"{d.title}"' for d in created_docs)
            msg_parts.append(f'Documentos nuevos: {doc_names}')
        if replaced_docs:
            doc_names = ', '.join(f'"{d.title}"' for d in replaced_docs)
            msg_parts.append(f'Documentos reemplazados: {doc_names}')
        if description:
            msg_parts.append(f'Motivo: {description}')
        message = '. '.join(msg_parts)

        if analyst:
            create_notification(
                recipient=analyst,
                actor=request.user,
                notification_type='revision',
                title='Actualización de Documento - Revisión',
                message=f'{message}. Revisa los documentos adjuntos.',
                expedient_id=expedient.id,
            )

        if recepcionista:
            create_notification(
                recipient=recepcionista,
                actor=request.user,
                notification_type='revision',
                title='Actualización de Documento - Gestión',
                message=f'{message}. Gestiona los documentos en el expediente.',
                expedient_id=expedient.id,
            )

        target_info = f'#{expedient.id} - {expedient.title} ({total_docs} documentos)'
        if analyst and recepcionista:
            target_info += f' → {analyst.username} / {recepcionista.username}'

        create_activity_log(
            user=request.user,
            action='Subió documentos directamente' if not analyst and not recepcionista else 'Solicitó actualización de documentos',
            action_type='create',
            target=target_info,
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'status': 'documentos subidos exitosamente' if not analyst and not recepcionista else 'actualización enviada',
            'created_documents': DocumentSerializer(created_docs, many=True).data,
            'replaced_documents': DocumentSerializer(replaced_docs, many=True).data,
        })

    @action(detail=False, methods=['post'])
    def request_document_only(self, request):
        """Admin solicita que el recepcionista suba o actualice un documento.
        Acepta document_id (documento existente) o document_type_id (tipo nuevo).
        """
        if request.user.rol != 'admin':
            return Response({'error': 'Solo administradores pueden solicitar'}, status=status.HTTP_403_FORBIDDEN)

        expedient_id = request.data.get('expedient_id')
        document_id = request.data.get('document_id')
        document_type_id = request.data.get('document_type_id')
        description = request.data.get('description', '')
        analyst_id = request.data.get('analyst_id')
        recepcionista_id = request.data.get('recepcionista_id')

        if not expedient_id or (not document_id and not document_type_id):
            return Response({'error': 'Debes seleccionar expediente y documento o tipo de documento'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            expedient = Expedient.objects.get(id=expedient_id)
        except Expedient.DoesNotExist:
            return Response({'error': 'Expediente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        document = None
        doc_name = ''
        if document_id:
            try:
                document = Document.objects.get(id=document_id, expedient=expedient)
                doc_name = document.title
                document.pending_update_request = True
                document.description_content = description
                document.save(update_fields=['pending_update_request', 'description_content'])
            except Document.DoesNotExist:
                return Response({'error': 'Documento no encontrado en este expediente'}, status=status.HTTP_404_NOT_FOUND)
        elif document_type_id:
            try:
                doc_type = DocumentType.objects.get(id=document_type_id)
                doc_name = doc_type.name
            except DocumentType.DoesNotExist:
                return Response({'error': 'Tipo de documento no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        analyst = None
        recepcionista = None
        if analyst_id:
            try:
                analyst = UsersCustom.objects.get(id=analyst_id, rol='analyst')
            except UsersCustom.DoesNotExist:
                return Response({'error': 'Analista no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        if recepcionista_id:
            try:
                recepcionista = UsersCustom.objects.get(id=recepcionista_id, rol='recepcionista')
            except UsersCustom.DoesNotExist:
                return Response({'error': 'Recepcionista no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        if recepcionista:
            create_notification(
                recipient=recepcionista,
                actor=request.user,
                notification_type='revision',
                title='Actualización de Documento Requerida',
                message=f'Debes subir el documento "{doc_name}" en el expediente "{expedient.title}". Motivo: {description}',
                expedient_id=expedient.id,
                document_id=document.id if document else None,
            )
        if analyst:
            create_notification(
                recipient=analyst,
                actor=request.user,
                notification_type='revision',
                title='Actualización de Documento - Revisión',
                message=f'Se ha solicitado la actualización del documento "{doc_name}" en el expediente "{expedient.title}". Motivo: {description}',
                expedient_id=expedient.id,
                document_id=document.id if document else None,
            )

        create_activity_log(
            user=request.user,
            action='Solicitó actualización de documento',
            action_type='edit',
            target=f'#{expedient.id} - {expedient.title} / {doc_name}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'status': 'actualización enviada',
        })

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """Reasigna el recepcionista a cargo del expediente"""
        if request.user.rol not in ['admin', 'analyst']:
            return Response({'error': 'No tienes permiso para reasignar'}, status=status.HTTP_403_FORBIDDEN)
        expedient = self.get_object()
        new_user_id = request.data.get('asinged_to')
        if not new_user_id:
            return Response({'error': 'Debes especificar el nuevo recepcionista'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_user = UsersCustom.objects.get(id=new_user_id, rol='recepcionista')
        except UsersCustom.DoesNotExist:
            return Response({'error': 'Usuario no encontrado o no es recepcionista'}, status=status.HTTP_400_BAD_REQUEST)
        expedient.asinged_to = new_user
        expedient.updated_at = now()
        expedient.save(update_fields=['asinged_to', 'updated_at'])
        create_notification(
            recipient=new_user,
            actor=request.user,
            notification_type='asignado',
            title='Expediente Reasignado',
            message=f'Se te ha reasignado el expediente "{expedient.title}" para su gestión.',
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=request.user,
            action='Reasignó expediente',
            action_type='edit',
            target=f'#{expedient.id} - {expedient.title} → {new_user.username}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': f'Expediente reasignado a {new_user.username}'})

    @action(detail=False, methods=['get'])
    def pending_docs(self, request):
        """Lista documentos pendientes de revisión en expedientes aprobados"""
        if request.user.rol not in ['admin', 'analyst']:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        docs = Document.objects.filter(approval_status=None, expedient__status='Aprobado').select_related('expedient', 'document_type', 'uploaded_by').order_by('-uploaded_at')
        from documents.serializers import DocumentSerializer
        serializer = DocumentSerializer(docs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def corrections_needed(self, request):
        """Obtiene documentos rechazados con correcciones pendientes para el usuario"""
        user = request.user
        if user.rol != 'recepcionista':
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
        """Envia un expediente a revisión verificando el checklist de documentos"""
        expedient = self.get_object()
        user = request.user

        if user.rol not in ['admin', 'analyst', 'recepcionista']:
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)

        if user.rol == 'recepcionista' and expedient.asinged_to != user:
            return Response({'error': 'Este expediente no te pertenece'}, status=status.HTTP_403_FORBIDDEN)

        if not expedient.is_draft:
            return Response({'error': 'Este expediente ya fue enviado a revisión'}, status=status.HTTP_400_BAD_REQUEST)

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
        expedient.rejection_reason = None
        expedient.save(update_fields=['is_draft', 'status', 'rejection_reason', 'updated_at'])

        analysts = UsersCustom.objects.filter(rol='analyst')
        bulk_create_notifications(
            recipients=analysts,
            actor=user,
            notification_type='revision',
            title='Expediente en Revision',
            message=f'El recepcionista {user.username} ha enviado el expediente "{expedient.title}" para revisión.',
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
            'message': 'Expediente enviado a revisión exitosamente',
            'expedient': ExpedientSerializer(expedient).data
        })

    @action(detail=True, methods=['post'])
    def save_draft(self, request, pk=None):
        """Marca un expediente como borrador"""
        expedient = self.get_object()
        user = request.user

        if user.rol not in ['admin', 'analyst', 'recepcionista']:
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)

        if user.rol == 'recepcionista' and expedient.asinged_to != user:
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
        expedient = serializer.instance
        if expedient.status == 'Finalizado':
            raise ValidationError('No se puede modificar un expediente cerrado')
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
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        role_name = user.rol
        if not user.is_authenticated or not role_name:
            return Expedient.objects.none()
        qs = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by')
        if role_name == 'admin':
            return qs.all()
        if role_name == 'analyst':
            return qs.filter(Q(created_by=user) | Q(is_draft=False))
        if role_name == 'recepcionista':
            return qs.filter(asinged_to=user)
        return Expedient.objects.none()

    def perform_create(self, serializer):
        if self.request.user.rol not in ['admin', 'analyst']:
            raise PermissionDenied('Solo administradores o analistas pueden crear expedientes')
        expedient = serializer.save(created_by=self.request.user)
        expedient.status = 'Pendiente'
        expedient.save(update_fields=['status'])
        recepcionista = expedient.asinged_to
        create_notification(
            recipient=recepcionista,
            actor=self.request.user,
            notification_type='asignado',
            title='Expediente Asignado',
            message=f'Se te ha asignado el expediente "{expedient.title}" para su gestión.',
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
        """Analista pre-aprueba el expediente, lo envía a admin para aprobación final"""
        if request.user.rol not in ['admin', 'analyst']:
            return Response({'error': 'Solo analistas o administradores pueden pre-aprobar expedientes'}, status=status.HTTP_403_FORBIDDEN)
        expedient = self.get_object()
        if expedient.status != 'Pendiente':
            return Response({'error': 'Solo se pueden pre-aprobar expedientes en estado Pendiente'}, status=status.HTTP_400_BAD_REQUEST)
        expedient.status = 'Pre_Aprobado'
        expedient.is_draft = False
        expedient.approved_by = request.user
        expedient.save(update_fields=['status', 'is_draft', 'approved_by', 'updated_at'])
        admins = UsersCustom.objects.filter(rol='admin')
        bulk_create_notifications(
            recipients=admins,
            actor=request.user,
            notification_type='revision',
            title='Expediente Pre-Aprobado',
            message=f'El analista {request.user.username} ha pre-aprobado el expediente "{expedient.title}" y espera tu aprobación final.',
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=request.user,
            action='Pre-aprobó expediente',
            action_type='approve',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'expediente pre-aprobado, pendiente de aprobación del admin', 'id': expedient.id})

    @action(detail=True, methods=['post'])
    def admin_approve(self, request, pk=None):
        """Admin da la aprobación final al expediente"""
        if request.user.rol != 'admin':
            return Response({'error': 'Solo administradores pueden dar la aprobación final'}, status=status.HTTP_403_FORBIDDEN)
        expedient = self.get_object()
        if expedient.status != 'Pre_Aprobado':
            return Response({'error': 'Solo se pueden aprobar expedientes en estado Pre-Aprobado'}, status=status.HTTP_400_BAD_REQUEST)
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
        """Lista expedientes pre-aprobados pendientes de aprobación del admin"""
        if request.user.rol != 'admin':
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        expedients = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by').filter(status='Pre_Aprobado', is_draft=False)
        serializer = self.get_serializer(expedients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def approved(self, request):
        """Lista expedientes aprobados definitivamente"""
        if request.user.rol not in ['admin', 'analyst']:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        expedients = Expedient.objects.select_related('department', 'asinged_to', 'approved_by', 'created_by', 'rejected_by').filter(status__in=['Aprobado', 'Finalizado'], is_draft=False).order_by('-updated_at')
        serializer = self.get_serializer(expedients, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.rol not in ['admin', 'analyst']:
            return Response({'error': 'No tienes permiso para rechazar expedientes'}, status=status.HTTP_403_FORBIDDEN)
        expedient = self.get_object()
        correcciones = request.data.get('correcciones', request.data.get('observation', ''))
        if not correcciones or not correcciones.strip():
            return Response({'error': 'Debes ingresar las correcciones requeridas'}, status=status.HTTP_400_BAD_REQUEST)
        expedient.status = 'Pendiente'
        expedient.is_draft = True
        expedient.rejected_by = request.user
        expedient.rejection_reason = correcciones.strip()
        expedient.save(update_fields=['status', 'is_draft', 'rejected_by', 'rejection_reason', 'updated_at'])
        Document.objects.filter(expedient=expedient).update(approval_status=None, description_state='pendiente')
        mensaje = f'Tu expediente "{expedient.title}" ha sido rechazado.'
        mensaje += f' Correcciones requeridas: {correcciones}'
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

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Cierra un expediente aprobado, cambiando su estado a Finalizado"""
        if request.user.rol != 'admin':
            return Response({'error': 'Solo administradores pueden cerrar expedientes'}, status=status.HTTP_403_FORBIDDEN)
        expedient = self.get_object()
        if expedient.status != 'Aprobado':
            return Response({'error': 'Solo se pueden cerrar expedientes en estado Aprobado'}, status=status.HTTP_400_BAD_REQUEST)
        expedient.status = 'Finalizado'
        expedient.save(update_fields=['status', 'updated_at'])
        create_notification(
            recipient=expedient.asinged_to,
            actor=request.user,
            notification_type='info',
            title='Expediente Cerrado',
            message=f'El expediente "{expedient.title}" ha sido cerrado por el administrador.',
            expedient_id=expedient.id,
        )
        create_activity_log(
            user=request.user,
            action='Cerró expediente',
            action_type='edit',
            target=f'#{expedient.id} - {expedient.title}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'expediente cerrado', 'id': expedient.id})

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
