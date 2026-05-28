#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if python -c "import socket; s=socket.socket(); s.connect(('$POSTGRES_HOST', $POSTGRES_PORT)); s.close()" 2>/dev/null; then
        echo "PostgreSQL ready."
        break
    fi
    sleep 1
done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
