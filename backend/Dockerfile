# Dockerfile para backend Django
FROM python:3.11-slim

WORKDIR /app

# Copia requirements y los instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código
COPY . .

# Expone el puerto donde corre Django
EXPOSE 8000

# Comando para correr el servidor Django (puedes cambiarlo para producción)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
# Comando para correr las migraciones al iniciar el contenedor
