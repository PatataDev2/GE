from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdminUser

from .models import DocumentType
from .serializers import DocumentTypeSerializer


class DocumentTypeViewSet(viewsets.ModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        queryset = DocumentType.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        document_type = get_object_or_404(DocumentType, pk=pk)
        serializer = self.get_serializer(document_type)
        return Response(serializer.data)

    def update(self, request, pk=None):
        document_type = get_object_or_404(DocumentType, pk=pk)
        serializer = self.get_serializer(document_type, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        document_type = get_object_or_404(DocumentType, pk=pk)
        document_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        document_type = get_object_or_404(DocumentType, pk=pk)
        document_type.is_active = True
        document_type.save()
        serializer = self.get_serializer(document_type)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        document_type = get_object_or_404(DocumentType, pk=pk)
        document_type.is_active = False
        document_type.save()
        serializer = self.get_serializer(document_type)
        return Response(serializer.data)
