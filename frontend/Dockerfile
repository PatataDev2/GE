FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S appuser && adduser -S -G appuser -h /var/cache/nginx appuser \
    && chown -R appuser:appuser /var/cache/nginx /var/run /usr/share/nginx/html \
    && touch /var/run/nginx.pid \
    && chown appuser:appuser /var/run/nginx.pid

USER appuser

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine AS dev

WORKDIR /app

RUN addgroup -S appuser && adduser -S -G appuser -h /app appuser \
    && chown -R appuser:appuser /app

ENV HOME=/app

USER appuser

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
