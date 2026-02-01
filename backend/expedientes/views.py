from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Expediente, Documento
from .serializers import ExpedienteSerializer, ExpedienteCreateSerializer, ExpedienteSolicitudSerializer, DocumentoSerializer, DocumentoUploadSerializer


class ExpedienteViewSet(viewsets.ModelViewSet):
    serializer_class = ExpedienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role.name == 'admin':
            return Expediente.objects.all()
        elif self.request.user.role.name == 'analyst':
            return Expediente.objects.filter(estado='revision_analista')
        else:
            return Expediente.objects.filter(empleado=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = ExpedienteCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Generate unique code
            last_expediente = Expediente.objects.all().order_by('id').last()
            if last_expediente:
                last_id = int(last_expediente.codigo.split('-')[-1])
                new_id = last_id + 1
            else:
                new_id = 1
            
            codigo = f"EXP-{new_id:04d}"
            
            expediente = Expediente.objects.create(
                codigo=codigo,
                empleado=request.user,
                **serializer.validated_data
            )
            
            return Response(
                ExpedienteSerializer(expediente).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def upload_documento(self, request, pk=None):
        expediente = self.get_object()
        serializer = DocumentoUploadSerializer(data=request.data)
        
        if serializer.is_valid():
            documento = Documento.objects.create(
                expediente=expediente,
                **serializer.validated_data
            )
            # Cambiar estado a revisión analista si es el primer documento
            if expediente.estado == 'en_proceso':
                expediente.estado = 'revision_analista'
                expediente.save()
            
            return Response(
                DocumentoSerializer(documento).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def solicitar_expediente(self, request):
        """Admin solicita a un empleado crear un expediente"""
        if request.user.role.name != 'admin':
            return Response(
                {'error': 'Solo administradores pueden solicitar expedientes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        empleado_id = request.data.get('empleado_id')
        nombre_expediente = request.data.get('nombre_expediente')
        departamento = request.data.get('departamento')
        
        if not all([empleado_id, nombre_expediente, departamento]):
            return Response(
                {'error': 'Faltan campos requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generar código único
        last_expediente = Expediente.objects.all().order_by('id').last()
        if last_expediente:
            last_id = int(last_expediente.codigo.split('-')[-1])
            new_id = last_id + 1
        else:
            new_id = 1
        
        codigo = f"EXP-{new_id:04d}"
        
        expediente = Expediente.objects.create(
            codigo=codigo,
            empleado_id=empleado_id,
            nombre_expediente=nombre_expediente,
            departamento=departamento,
            solicitado_por=request.user,
            estado='solicitado'
        )
        
        return Response(
            ExpedienteSerializer(expediente).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def iniciar_proceso(self, request, pk=None):
        """Empleado inicia el proceso de crear expediente"""
        expediente = self.get_object()
        
        if expediente.empleado != request.user:
            return Response(
                {'error': 'No tienes permiso para este expediente'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if expediente.estado != 'solicitado':
            return Response(
                {'error': 'El expediente ya está en proceso'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expediente.estado = 'en_proceso'
        expediente.save()
        
        return Response(
            ExpedienteSerializer(expediente).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def validar_documento(self, request, pk=None):
        """Analista valida o rechaza un documento"""
        if request.user.role.name != 'analyst':
            return Response(
                {'error': 'Solo analistas pueden validar documentos'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        documento = get_object_or_404(Documento, id=request.data.get('documento_id'))
        accion = request.data.get('accion')  # 'aprobar' o 'rechazar'
        observaciones = request.data.get('observaciones', '')
        
        if accion == 'aprobar':
            documento.estado = 'aprobado_analista'
        elif accion == 'rechazar':
            documento.estado = 'rechazado_analista'
        else:
            return Response(
                {'error': 'Acción inválida'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documento.observaciones = observaciones
        documento.revisado_por = request.user
        documento.save()
        
        # Verificar si todos los documentos están aprobados
        expediente = documento.expediente
        todos_aprobados = not expediente.documentos.filter(
            estado__in=['pendiente', 'rechazado_analista']
        ).exists()
        
        if todos_aprobados:
            expediente.estado = 'aprobado'
            expediente.save()
        
        return Response(
            DocumentoSerializer(documento).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def respuesta_final(self, request, pk=None):
        """Admin da respuesta final"""
        if request.user.role.name != 'admin':
            return Response(
                {'error': 'Solo administradores pueden dar respuesta final'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        expediente = self.get_object()
        accion = request.data.get('accion')  # 'aprobar' o 'rechazar'
        respuesta = request.data.get('respuesta', '')
        
        if accion == 'aprobar':
            expediente.estado = 'cerrado'
        elif accion == 'rechazar':
            expediente.estado = 'rechazado'
        else:
            return Response(
                {'error': 'Acción inválida'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expediente.respuesta_final = respuesta
        expediente.save()
        
        return Response(
            ExpedienteSerializer(expediente).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        expediente = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado in ['activo', 'en_revision', 'cerrado', 'rechazado']:
            expediente.estado = nuevo_estado
            if 'observaciones' in request.data:
                expediente.observaciones = request.data['observaciones']
            expediente.save()
            
            return Response(
                ExpedienteSerializer(expediente).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'error': 'Estado inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )


class DocumentoViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    queryset = Documento.objects.all()
    
    def get_queryset(self):
        expediente_id = self.request.query_params.get('expediente')
        if expediente_id:
            return Documento.objects.filter(expediente_id=expediente_id)
        
        # Filter by user role
        if self.request.user.role.name in ['admin', 'analyst']:
            return Documento.objects.all()
        else:
            return Documento.objects.filter(expediente__empleado=self.request.user)
    
    def perform_create(self, serializer):
        expediente_id = self.request.data.get('expediente')
        expediente = get_object_or_404(Expediente, id=expediente_id)
        
        # Check permissions
        if (self.request.user.role.name not in ['admin', 'analyst'] and 
            expediente.empleado != self.request.user):
            raise permissions.PermissionDenied()
        
        serializer.save(expediente=expediente)
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        documento = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado in ['aprobado', 'pendiente', 'rechazado']:
            documento.estado = nuevo_estado
            if 'observaciones' in request.data:
                documento.observaciones = request.data['observaciones']
            documento.save()
            
            return Response(
                DocumentoSerializer(documento).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'error': 'Estado inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )