import os
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer
from notifications.utils import create_notification, create_activity_log

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
      
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_name = user.rol
        if not user.is_authenticated or not role_name:
            return Document.objects.none()

        if role_name in ['admin', 'analyst']:
            queryset = Document.objects.all()
        else:
            queryset = Document.objects.filter(expedient__asinged_to=user)
        
        expedient_id = self.request.query_params.get('expedient')
        if expedient_id:
            queryset = queryset.filter(expedient_id=expedient_id)
        
        return queryset

    def perform_create(self, serializer):
        document = serializer.save(uploaded_by=self.request.user)
        
        from users.models import UsersCustom
        analysts = UsersCustom.objects.filter(rol='analyst')
        for analyst in analysts:
            create_notification(
                recipient=analyst,
                actor=self.request.user,
                notification_type='revision',
                title='Nuevo Documento Subido',
                message=f'El trabajador {self.request.user.username} ha subido el documento "{document.title}" del expediente "{document.expedient.title}".',
                expedient_id=document.expedient.id,
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
        
        if 'approval_status' in request.data and request.user.rol == 'employee':
            return Response(
                {"error": "Los trabajadores no pueden aprobar documentos."},
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
        
        if user.rol != 'employee':
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
        
        from users.models import UsersCustom
        analysts = UsersCustom.objects.filter(rol='analyst')
        for analyst in analysts:
            create_notification(
                recipient=analyst,
                actor=user,
                notification_type='revision',
                title='Documento Corregido',
                message=f'El trabajador {user.username} ha corregido el documento "{document.title}" del expediente "{document.expedient.title}".',
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

        from .serializers import DocumentSerializer
        return Response({
            'message': 'Archivo reemplazado exitosamente',
            'document': DocumentSerializer(document).data
        })

    @action(detail=True, methods=['get'])
    def view_pdf(self, request, pk=None):
        """Convierte DOCX a PDF y lo devuelve para visualizacion en el navegador"""
        import tempfile
        import subprocess
        from django.http import FileResponse

        document = self.get_object()
        if not document.file:
            return Response({'error': 'El documento no tiene archivo'}, status=status.HTTP_400_BAD_REQUEST)

        file_path = document.file.path
        ext = os.path.splitext(file_path)[1].lower() if file_path else ''

        if ext == '.pdf':
            response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{document.docname}"'
            return response

        if ext == '.docx':
            with tempfile.TemporaryDirectory() as tmpdir:
                try:
                    home_dir = os.path.join(tmpdir, 'lo_home')
                    os.makedirs(home_dir, exist_ok=True)
                    result = subprocess.run(
                        ['libreoffice', '--headless', '--convert-to', 'pdf',
                         '--outdir', tmpdir, file_path],
                        capture_output=True, timeout=60,
                        env={**os.environ, 'HOME': home_dir}
                    )
                    # cleanup LibreOffice user profile
                    import shutil
                    lo_config = os.path.join(home_dir, '.config', 'libreoffice')
                    if os.path.exists(lo_config):
                        shutil.rmtree(lo_config, ignore_errors=True)
                    if result.returncode != 0:
                        return Response(
                            {'error': f'Error al convertir el documento: {result.stderr.decode()}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                except Exception as e:
                    return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                pdf_name = os.path.splitext(os.path.basename(file_path))[0] + '.pdf'
                pdf_path = os.path.join(tmpdir, pdf_name)

                if os.path.exists(pdf_path):
                    response = FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
                    response['Content-Disposition'] = f'inline; filename="{os.path.splitext(document.docname)[0]}.pdf"'
                    return response

        return Response({'error': 'Tipo de archivo no soportado'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        document = self.get_object()
        
        if request.user.rol == 'employee':
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
                document.description_corrections = request.data['corrections']
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
        
        return Response({
            'id': document.id,
            'title': document.title,
            'approval_status': document.approval_status,
            'description_state': document.description_state,
            'description_content': document.description_content
        })