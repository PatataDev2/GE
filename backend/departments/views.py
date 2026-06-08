from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdminUser

from .models import Department
from .serializers import DepartmentSerializer


def _require_admin(request):
    if not IsAdminUser().has_permission(request, None):
        return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
    return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def department_list(request):
    if request.method == 'GET':
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        error = _require_admin(request)
        if error:
            return error
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def department_detail(request, pk):
    try:
        department = Department.objects.get(pk=pk)
    except Department.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = DepartmentSerializer(department)
        return Response(serializer.data)

    elif request.method in ('PUT', 'DELETE'):
        error = _require_admin(request)
        if error:
            return error
        if request.method == 'PUT':
            serializer = DepartmentSerializer(department, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            department.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
