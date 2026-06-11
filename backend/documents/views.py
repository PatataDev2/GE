import logging
import os

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from notifications.utils import (
    bulk_create_notifications,
    create_activity_log,
    create_notification,
)

from .models import Document
from .serializers import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE,
    DocumentSerializer,
    validate_file_magic,
)

logger = logging.getLogger(__name__)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        role_name = user.rol
        if not user.is_authenticated or not role_name:
            return Document.objects.none()

        queryset = Document.objects.select_related('expedient', 'document_type', 'uploaded_by')
        if role_name not in ['admin', 'analyst']:
            queryset = queryset.filter(expedient__asinged_to=user)

        expedient_id = self.request.query_params.get('expedient')
        if expedient_id:
            queryset = queryset.filter(expedient_id=expedient_id)

        return queryset

    def perform_create(self, serializer):
        document = serializer.save(uploaded_by=self.request.user)
        expedient = document.expedient

        from users.models import UsersCustom
        analysts = UsersCustom.objects.filter(rol='analyst')

        if expedient.status == 'Aprobado':
            expedient.has_pending_updates = True
            expedient.save(update_fields=['has_pending_updates', 'updated_at'])
            bulk_create_notifications(
                recipients=analysts,
                actor=self.request.user,
                notification_type='revision',
                title='Documento Agregado a Expediente Aprobado',
                message=f'{self.request.user.username} ha agregado el documento "{document.title}" al expediente aprobado "{expedient.title}". Requiere revisión.',
                expedient_id=expedient.id,
                document_id=document.id,
            )
        else:
            actor_role = self.request.user.rol
            bulk_create_notifications(
                recipients=analysts,
                actor=self.request.user,
                notification_type='revision',
                title='Nuevo Documento Subido',
                message=f'El {actor_role} {self.request.user.username} ha subido el documento "{document.title}" del expediente "{expedient.title}".',
                expedient_id=expedient.id,
                document_id=document.id,
            )

        create_activity_log(
            user=self.request.user,
            action='Subió documento',
            action_type='upload',
            target=document.file.name if document.file else document.title,
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if 'approval_status' in request.data and request.user.rol == 'recepcionista':
            return Response(
                {"error": "Los recepcionistas no pueden aprobar documentos."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        create_activity_log(
            user=self.request.user,
            action='Editó documento',
            action_type='edit',
            target=instance.title,
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def replace_file(self, request, pk=None):
        """Reemplaza el archivo de un documento rechazado y lo vuelve a pendiente"""
        document = self.get_object()
        user = request.user

        if user.rol != 'recepcionista':
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)

        if document.expedient.asinged_to != user:
            return Response({'error': 'Este documento no te pertenece'}, status=status.HTTP_403_FORBIDDEN)

        if document.approval_status is not False:
            return Response({'error': 'Solo se pueden reemplazar documentos rechazados'}, status=status.HTTP_400_BAD_REQUEST)

        if 'file' not in request.data:
            return Response({'error': 'Debes proporcionar un archivo'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.data['file']
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response({'error': f'Tipo de archivo no permitido ({ext})'}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded_file.size > MAX_FILE_SIZE:
            return Response({'error': 'El archivo excede el tamaño máximo de 10 MB'}, status=status.HTTP_400_BAD_REQUEST)
        detected_ext = validate_file_magic(uploaded_file)
        if detected_ext is None:
            return Response({'error': 'No se pudo verificar el tipo de archivo'}, status=status.HTTP_400_BAD_REQUEST)
        if detected_ext != ext:
            return Response({'error': 'El contenido del archivo no coincide con la extensión'}, status=status.HTTP_400_BAD_REQUEST)

        old_file_path = document.file.path if document.file else None

        document.file = uploaded_file
        document.approval_status = None
        document.description_state = 'pendiente'
        document.description_corrections = ''
        document.save()

        if old_file_path:
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        from users.models import UsersCustom
        analysts = UsersCustom.objects.filter(rol='analyst')
        bulk_create_notifications(
            recipients=analysts,
            actor=user,
            notification_type='revision',
            title='Documento Corregido',
            message=f'El recepcionista {user.username} ha corregido el documento "{document.title}" del expediente "{document.expedient.title}".',
            expedient_id=document.expedient.id,
            document_id=document.id,
        )

        create_activity_log(
            user=user,
            action='Reemplazó archivo de documento',
            action_type='upload',
            target=document.file.name if document.file else document.title,
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'message': 'Archivo reemplazado exitosamente',
            'document': DocumentSerializer(document).data
        })

    @action(detail=True, methods=['get'])
    def view_pdf(self, request, pk=None):
        """Convierte DOCX a PDF y lo devuelve para visualizacion en el navegador"""
        import io
        import subprocess
        import tempfile

        from django.conf import settings
        from django.http import FileResponse

        document = self.get_object()
        if not document.file:
            return Response({'error': 'El documento no tiene archivo'}, status=status.HTTP_400_BAD_REQUEST)

        file_path = os.path.realpath(document.file.path)
        media_root = os.path.realpath(settings.MEDIA_ROOT)
        if not file_path.startswith(media_root):
            return Response({'error': 'Ruta de archivo inválida'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_path)[1].lower() if file_path else ''

        safe_filename = document.docname.replace('"', '').replace('\n', '').replace('\r', '')
        if ext == '.pdf':
            response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{safe_filename}"'
            return response

        if ext == '.docx':
            pdf_buffer = io.BytesIO()
            with tempfile.TemporaryDirectory() as tmpdir:
                try:
                    home_dir = os.path.join(tmpdir, 'lo_home')
                    os.makedirs(home_dir, exist_ok=True)
                    logger.info('Converting DOCX to PDF: %s', os.path.basename(file_path))
                    result = subprocess.run(
                        ['libreoffice', '--headless', '--convert-to', 'pdf',
                         '--outdir', tmpdir, '--', file_path],
                        capture_output=True, timeout=60,
                        env={**os.environ, 'HOME': home_dir}
                    )
                    import shutil
                    lo_config = os.path.join(home_dir, '.config', 'libreoffice')
                    if os.path.exists(lo_config):
                        shutil.rmtree(lo_config, ignore_errors=True)
                    if result.returncode != 0:
                        stderr_output = result.stderr.decode('utf-8', errors='replace')
                        logger.warning('LibreOffice conversion failed (rc=%d): %s', result.returncode, stderr_output)
                        return Response(
                            {'error': 'Error al convertir el documento'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                except subprocess.TimeoutExpired:
                    logger.error('LibreOffice conversion timed out for: %s', os.path.basename(file_path))
                    return Response(
                        {'error': 'La conversión del documento excedió el tiempo límite'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                except Exception as e:
                    logger.exception('LibreOffice conversion error: %s', str(e))
                    return Response({'error': 'Error al convertir el documento'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                pdf_name = os.path.splitext(os.path.basename(file_path))[0] + '.pdf'
                pdf_path = os.path.join(tmpdir, pdf_name)

                if os.path.exists(pdf_path):
                    with open(pdf_path, 'rb') as f:
                        pdf_buffer.write(f.read())

            pdf_buffer.seek(0)
            response = FileResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{os.path.splitext(safe_filename)[0]}.pdf"'
            return response

        return Response({'error': 'Tipo de archivo no soportado'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Lista documentos pendientes de revisión (approval_status=None)"""
        if request.user.rol not in ['admin', 'analyst']:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        docs = Document.objects.filter(approval_status=None).select_related('expedient', 'document_type', 'uploaded_by').order_by('-uploaded_at')
        serializer = self.get_serializer(docs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        document = self.get_object()

        if request.user.rol == 'recepcionista':
            return Response(
                {"error": "No tienes permiso para revisar documentos."},
                status=status.HTTP_403_FORBIDDEN
            )

        action_type = request.data.get('action')
        message = request.data.get('message', '')

        if action_type not in ['approve', 'reject']:
            return Response(
                {"error": "Accion invalida. Use 'approve' o 'reject'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action_type == 'approve':
            document.approval_status = True
            document.description_state = 'aprobado'
            document.description_content = message
            create_notification(
                recipient=document.uploaded_by,
                actor=request.user,
                notification_type='aprobado',
                title='Documento Aprobado',
                message=f'Tu documento "{document.title}" del expediente "{document.expedient.title}" ha sido aprobado.',
                expedient_id=document.expedient.id,
                document_id=document.id,
            )
            create_activity_log(
                user=request.user,
                action='Aprobó documento',
                action_type='approve',
                target=document.title,
                ip_address=request.META.get('REMOTE_ADDR'),
            )
        else:
            document.approval_status = False
            document.description_state = 'rechazado'
            document.description_content = message
            if request.data.get('corrections'):
                from django.utils.html import escape
                document.description_corrections = escape(request.data['corrections'])
            create_notification(
                recipient=document.uploaded_by,
                actor=request.user,
                notification_type='correccion',
                title='Documento Rechazado',
                message=f'Tu documento "{document.title}" del expediente "{document.expedient.title}" fue rechazado. Motivo: {message}',
                expedient_id=document.expedient.id,
                document_id=document.id,
            )
            create_activity_log(
                user=request.user,
                action='Rechazó documento',
                action_type='reject',
                target=document.title,
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        document.save()

        expedient = document.expedient
        if expedient.status == 'Aprobado' and expedient.has_pending_updates:
            still_pending = Document.objects.filter(expedient=expedient, approval_status=None).exists()
            if not still_pending:
                expedient.has_pending_updates = False
                expedient.save(update_fields=['has_pending_updates', 'updated_at'])

        return Response({
            'id': document.id,
            'title': document.title,
            'approval_status': document.approval_status,
            'description_state': document.description_state,
            'description_content': document.description_content
        })
