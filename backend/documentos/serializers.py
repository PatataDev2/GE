from rest_framework import serializers
from .models import Documento
from users.serializers import UsersCustomSerializer
from expedientes.serializers import ExpedienteDetailSerializer

class DocumentoListSerializer(serializers.ModelSerializer):
    expediente_codigo = serializers.CharField(source='expediente.codigo', read_only=True)
    expediente_titulo = serializers.CharField(source='expediente.titulo', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    es_version_mas_reciente = serializers.ReadOnlyField()
    
    class Meta:
        model = Documento
        fields = ['id', 'numero_folio', 'titulo', 'tipo_documento', 'version', 
                  'expediente_codigo', 'expediente_titulo', 'creado_por_nombre',
                  'fecha_creacion', 'es_version_mas_reciente']

class DocumentoDetailSerializer(serializers.ModelSerializer):
    expediente = ExpedienteDetailSerializer(read_only=True)
    creado_por = UsersCustomSerializer(read_only=True)
    es_version_mas_reciente = serializers.ReadOnlyField()
    archivo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Documento
        fields = '__all__'
    
    def get_archivo_url(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo.url)
            return obj.archivo.url
        return None

class DocumentoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['expediente', 'titulo', 'tipo_documento', 'archivo', 'descripcion']
    
    def validate_expediente(self, value):
        if not value.puede_agregar_documentos:
            raise serializers.ValidationError(
                'No se pueden agregar documentos a un expediente cerrado o archivado'
            )
        return value
    
    def create(self, validated_data):
        # El número de folio se asignará automáticamente en el método save del modelo
        validated_data['numero_folio'] = 0  # Valor temporal, se reasignará en save()
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)

class DocumentoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['titulo', 'descripcion']
    
    def validate(self, attrs):
        if self.instance and not self.instance.es_version_mas_reciente:
            raise serializers.ValidationError(
                'No se puede modificar una versión antigua. Cree una nueva versión en su lugar.'
            )
        return attrs

class NuevaVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['titulo', 'tipo_documento', 'archivo', 'descripcion']
    
    def validate_archivo(self, value):
        if not value:
            raise serializers.ValidationError('El archivo es requerido para crear una nueva versión')
        return value
    
    def create_nueva_version(self, documento_original):
        titulo = self.validated_data.get('titulo', documento_original.titulo)
        descripcion = self.validated_data.get('descripcion', documento_original.descripcion)
        archivo = self.validated_data['archivo']
        usuario = self.context['request'].user
        
        return documento_original.crear_nueva_version(
            nuevo_archivo=archivo,
            titulo=titulo,
            descripcion=descripcion,
            usuario=usuario
        )

class DocumentoHistorialSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    archivo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Documento
        fields = ['id', 'version', 'titulo', 'descripcion', 'creado_por_nombre',
                  'fecha_creacion', 'archivo_url']
    
    def get_archivo_url(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo.url)
            return obj.archivo.url
        return None
