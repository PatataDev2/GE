FROM node:22-alpine

WORKDIR /app

# Copiar solo package.json y package-lock.json primero para cachear instalación
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Comando para desarrollo
CMD ["npm", "run", "dev"]
