from django import forms
from .models import Expediente, Documento

class ExpedienteForm(forms.ModelForm):
    class Meta:
        model = Expediente
        fields = ['titulo', 'descripcion', 'usuario', 'nombre_referencia', 'departamento']
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'usuario': forms.Select(attrs={'class': 'form-control'}),
            'nombre_referencia': forms.TextInput(attrs={'class': 'form-control'}),
            'departamento': forms.Select(attrs={'class': 'form-control'}),
        }

class DocumentoForm(forms.ModelForm):
    class Meta:
        model = Documento
        fields = ['titulo', 'descripcion', 'documento', 'tipo']
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'documento': forms.FileInput(attrs={'class': 'form-control'}),
            'tipo': forms.Select(attrs={'class': 'form-control'}),
        }
