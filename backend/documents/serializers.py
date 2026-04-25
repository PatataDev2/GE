import os
from rest_framework import serializers
from .models import Document
from expedients.serializers import ExpedientSerializer
from document_types.serializers import DocumentTypeSerializer

class DocumentSerializer(serializers.ModelSerializer):
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
        read_only_fields = ['uploaded_at', 'uploaded_by', 'approval_status']

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            data['uploaded_by'] = request.user

        file_obj = data.get('file')
        expedient_obj = data.get('expedient')
        
        if file_obj and expedient_obj:
            data['docname'] = file_obj.name
            data['path'] = f".uploads/docs/{expedient_obj.id}/{file_obj.name}"
            
        return data

    def create(self, validated_data):
        if 'uploaded_by' not in validated_data:
            validated_data['uploaded_by'] = self.context['request'].user
        if 'approval_status' not in validated_data:
            validated_data['approval_status'] = None
        return super().create(validated_data)