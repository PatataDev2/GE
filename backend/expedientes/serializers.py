from rest_framework import serializers
from .models import Expediente, Documento
from users.serializer import UserSerializer
from document_types.serializers import DocumentTypeSerializer


class DocumentoSerializer(serializers.ModelSerializer):
    tipo_documento = DocumentTypeSerializer(read_only=True)
    revisado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = Documento
        fields = ['id', 'nombre_archivo', 'archivo', 'tipo_documento', 'estado', 
                  'observaciones', 'revisado_por', 'fecha_subida', 'fecha_actualizacion']
        read_only_fields = ['fecha_subida', 'fecha_actualizacion']


class ExpedienteSerializer(serializers.ModelSerializer):
    empleado = UserSerializer(read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    documentos_count = serializers.SerializerMethodField()
    solicitado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = Expediente
        fields = ['id', 'codigo', 'nombre_expediente', 'empleado', 'departamento', 
                  'solicitado_por', 'observaciones', 'respuesta_final', 'estado', 
                  'fecha_creacion', 'fecha_actualizacion', 'documentos', 'documentos_count']
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    def get_documentos_count(self, obj):
        return obj.documentos.count()


class ExpedienteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expediente
        fields = ['departamento', 'observaciones']

class ExpedienteSolicitudSerializer(serializers.ModelSerializer):
    empleado_name = serializers.CharField(source='empleado.username', read_only=True)
    solicitado_por_name = serializers.CharField(source='solicitado_por.username', read_only=True)
    
    class Meta:
        model = Expediente
        fields = ['codigo', 'nombre_expediente', 'departamento', 'empleado', 'empleado_name', 
                  'solicitado_por', 'solicitado_por_name', 'estado', 'fecha_creacion']


class DocumentoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['nombre_archivo', 'archivo', 'tipo_documento', 'observaciones']