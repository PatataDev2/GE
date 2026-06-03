import os
import json
import datetime
from io import BytesIO
from django.http import FileResponse
from django.core.management import call_command
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.permissions import IsAdminUser


BACKUP_DIR = os.path.join(settings.BASE_DIR, 'backups')


def _get_backups():
    if not os.path.exists(BACKUP_DIR):
        return []
    backups = []
    for f in sorted(os.listdir(BACKUP_DIR), reverse=True):
        if f.endswith('.json'):
            fpath = os.path.join(BACKUP_DIR, f)
            stat = os.stat(fpath)
            size_kb = stat.st_size / 1024
            size_str = f'{size_kb:.1f} KB' if size_kb < 1024 else f'{size_kb / 1024:.1f} MB'
            backups.append({
                'id': f,
                'name': f,
                'size': size_str,
                'date': datetime.datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                'type': 'auto' if 'auto' in f else 'manual',
                'status': 'completado',
            })
    return backups


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_list(request):
    if request.method == 'GET':
        return Response(_get_backups())

    if request.method == 'POST':
        os.makedirs(BACKUP_DIR, exist_ok=True)
        ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        output = os.path.join(BACKUP_DIR, f'backup_{ts}.json')

        apps = [
            'users.UsersCustom',
            'departments.Department',
            'document_types.DocumentType',
            'expedients.Expedient',
            'documents.Document',
            'notifications.Notification',
            'notifications.ActivityLog',
        ]

        try:
            with open(output, 'w', encoding='utf-8') as f:
                call_command('dumpdata', *apps, format='json', indent=2, stdout=f)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        from notifications.utils import create_activity_log
        create_activity_log(
            user=request.user, action='Creó respaldo de base de datos',
            action_type='backup', target=output,
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        stat = os.stat(output)
        size_kb = stat.st_size / 1024
        size_str = f'{size_kb:.1f} KB' if size_kb < 1024 else f'{size_kb / 1024:.1f} MB'
        return Response({
            'id': f'backup_{ts}.json',
            'name': f'backup_{ts}.json',
            'size': size_str,
            'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'type': 'manual',
            'status': 'completado',
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_detail(request, filename):
    filename = os.path.basename(filename)
    filepath = os.path.join(BACKUP_DIR, filename)

    if not os.path.exists(filepath):
        return Response({'error': 'Backup no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        response = FileResponse(open(filepath, 'rb'), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    if request.method == 'DELETE':
        os.remove(filepath)
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == 'POST':
        try:
            call_command('loaddata', filepath)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        from notifications.utils import create_activity_log
        create_activity_log(
            user=request.user, action='Restauró base de datos desde respaldo',
            action_type='backup', target=filename,
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({'message': 'Datos restaurados exitosamente'})
