import os
from rest_framework import serializers
from .models import Document
from expedients.serializers import ExpedientSerializer # Opcional para lectura
from document_types.serializers import DocumentTypeSerializer # Opcional para lectura

class DocumentSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para el usuario final (se llenan automáticamente)
    path = serializers.CharField(read_only=True)
    docname = serializers.CharField(read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'path', 'docname',
            'description_state', 'description_content', 'description_corrections',
            'expedient', 'document_type', 'uploaded_by', 'uploaded_by_name',
            'approval_status', 'expiration_date', 'uploaded_at'
        ]
        # El usuario no debería tener que enviar estos campos manualmente
        read_only_fields = ['uploaded_at', 'uploaded_by']

    def validate(self, data):
        """
        Lógica para extraer el nombre del archivo y construir el path 
        antes de que se guarde en la base de datos.
        """
        request = self.context.get('request')
        if request and request.user:
            data['uploaded_by'] = request.user

        # Si hay un archivo en la subida
        file_obj = data.get('file')
        expedient_obj = data.get('expedient')
        
        if file_obj and expedient_obj:
            # Extraemos el nombre real del archivo
            data['docname'] = file_obj.name
            
            # Construimos el path lógico (ejemplo: .uploads/docs/ID_EXPEDIENTE/nombre_archivo)
            # Esto es lo que se guardará en el campo 'path'
            data['path'] = f".uploads/docs/{expedient_obj.id}/{file_obj.name}"
            
        return data

    def create(self, validated_data):
        # El 'uploaded_by' se asigna desde el contexto del request si no se envió
        if 'uploaded_by' not in validated_data:
            validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)