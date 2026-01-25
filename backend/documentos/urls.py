from django.urls import path
from . import views

urlpatterns = [
    path('expedientes/', views.ExpedienteList.as_view()),
    path('expedientes/<int:pk>/', views.ExpedienteDetail.as_view()),
    path('documentos/', views.DocumentoList.as_view()),
    path('documentos/<int:pk>/', views.DocumentoDetail.as_view()),
]
