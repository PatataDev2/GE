from django.shortcuts import render, redirect, get_object_or_404
from django.views import generic
from django.urls import reverse_lazy
from rest_framework import generics
from .models import Expediente, Documento
from .serializer import ExpedienteSerializer, DocumentoSerializer
from .forms import ExpedienteForm, DocumentoForm

# API Views
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

# Frontend Views (Template Views)
class ExpedienteListView(generic.ListView):
    model = Expediente
    template_name = 'documentos/expediente_list.html'
    context_object_name = 'expedientes'

class ExpedienteDetailView(generic.DetailView):
    model = Expediente
    template_name = 'documentos/expediente_detail.html'
    context_object_name = 'expediente'

class ExpedienteCreateView(generic.CreateView):
    model = Expediente
    form_class = ExpedienteForm
    template_name = 'documentos/expediente_form.html'
    success_url = reverse_lazy('expediente-list')

class ExpedienteUpdateView(generic.UpdateView):
    model = Expediente
    form_class = ExpedienteForm
    template_name = 'documentos/expediente_form.html'
    
    def get_success_url(self):
        return reverse_lazy('expediente-detail', kwargs={'pk': self.object.pk})

class DocumentoCreateView(generic.CreateView):
    model = Documento
    form_class = DocumentoForm
    template_name = 'documentos/documento_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.GET.get('expediente_id'):
            context['expediente_id'] = self.request.GET.get('expediente_id')
        return context

    def form_valid(self, form):
        if self.request.GET.get('expediente_id'):
            form.instance.expediente_id = self.request.GET.get('expediente_id')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('expediente-detail', kwargs={'pk': self.object.expediente.pk})
