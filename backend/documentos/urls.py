from django.urls import path
from . import views

urlpatterns = [
    path('api/expedientes/', views.ExpedienteList.as_view()),
    path('api/expedientes/<int:pk>/', views.ExpedienteDetail.as_view()),
    path('api/documentos/', views.DocumentoList.as_view()),
    path('api/documentos/<int:pk>/', views.DocumentoDetail.as_view()),

    # Template Views
    path('expedientes/', views.ExpedienteListView.as_view(), name='expediente-list'),
    path('expedientes/nuevo/', views.ExpedienteCreateView.as_view(), name='expediente-create'),
    path('expedientes/<int:pk>/', views.ExpedienteDetailView.as_view(), name='expediente-detail'),
    path('expedientes/<int:pk>/editar/', views.ExpedienteUpdateView.as_view(), name='expediente-update'),
    path('documentos/nuevo/', views.DocumentoCreateView.as_view(), name='documento-create'),
]
