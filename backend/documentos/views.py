from django.shortcuts import render
from rest_framework import generics
from .models import Expediente, Documento
from .serializer import ExpedienteSerializer, DocumentoSerializer

class ExpedienteList(generics.ListCreateAPIView):
    queryset = Expediente.objects.all()
    serializer_class = ExpedienteSerializer

class ExpedienteDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Expediente.objects.all()
    serializer_class = ExpedienteSerializer

class DocumentoList(generics.ListCreateAPIView):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer

class DocumentoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
