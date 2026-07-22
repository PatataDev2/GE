from django.contrib.auth import get_user_model
User = get_user_model()

print('=== USUARIOS ===')
for u in User.objects.all().order_by('id'):
    print(f'  #{u.id}: {u.username} | rol={u.rol}')

from expedients.models import Expedient
aprobados = Expedient.objects.filter(status='Aprobado')
print(f'=== EXPEDIENTES APROBADOS ({aprobados.count()}) ===')
for e in aprobados:
    asignado = e.asinged_to.username if e.asinged_to else 'Nadie'
    creador = e.created_by.username if e.created_by else 'Nadie'
    print(f'  #{e.id}: {e.title} | asignado a: {asignado} | creado por: {creador}')
