import os
from rest_framework import serializers
from .models import Document
from expedients.serializers import ExpedientSerializer
from document_types.serializers import DocumentTypeSerializer

ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

class DocumentSerializer(serializers.ModelSerializer):
    path = serializers.CharField(read_only=True)
    docname = serializers.CharField(read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    document_type_name = serializers.CharField(source='document_type.name', read_only=True, allow_null=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'path', 'docname',
            'description_state', 'description_content', 'description_corrections',
            'expedient', 'document_type', 'document_type_name', 'uploaded_by', 'uploaded_by_name',
            'approval_status', 'expiration_date', 'uploaded_at'
        ]
        read_only_fields = ['uploaded_at', 'uploaded_by', 'approval_status']

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            data['uploaded_by'] = request.user
            user = request.user
            
            if user.rol == 'employee':
                expedient_obj = data.get('expedient')
                if expedient_obj and expedient_obj.asinged_to_id != user.id:
                    raise serializers.ValidationError(
                        "No tienes permiso para subir documentos a este expediente."
                    )

        file_obj = data.get('file')
        expedient_obj = data.get('expedient')
        
        if file_obj and expedient_obj:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise serializers.ValidationError(
                    f"Tipo de archivo no permitido ({ext}). Extensiones permitidas: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                )
            if file_obj.size > MAX_FILE_SIZE:
                raise serializers.ValidationError(
                    f"El archivo excede el tamaño máximo de 10 MB."
                )
            data['docname'] = file_obj.name
            data['path'] = f"uploads/docs/{expedient_obj.id}/{file_obj.name}"
            
        return data

    def create(self, validated_data):
        if 'uploaded_by' not in validated_data:
            validated_data['uploaded_by'] = self.context['request'].user
        if 'approval_status' not in validated_data:
            validated_data['approval_status'] = None
        return super().create(validated_data)