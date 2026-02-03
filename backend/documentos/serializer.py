from rest_framework import serializers
from .models import Expediente, Documento

class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = '__all__'

class ExpedienteSerializer(serializers.ModelSerializer):
    documentos = DocumentoSerializer(many=True, read_only=True)
    numero_de_documentos = serializers.ReadOnlyField()

    class Meta:
        model = Expediente
        fields = '__all__'
