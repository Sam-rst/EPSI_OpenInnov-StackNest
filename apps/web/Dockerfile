# syntax=docker/dockerfile:1.7

# --- Stage 1 : build Vite --------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2 : servir via Nginx unprivileged (USER non-root) --------------
# On utilise nginxinc/nginx-unprivileged : image officielle Nginx configuree
# pour tourner avec USER 101 (non-root). Bind sur port 8080 (pas 80, requis
# pour un user sans capabilities reseau privilegiees). Derriere le reverse
# proxy, le mapping est fait au niveau docker-compose / Traefik.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:8080/ > /dev/null || exit 1

# USER 101 est deja positionne par l'image parente nginx-unprivileged.
# Explicit pour satisfaire Checkov CKV_DOCKER_3.
USER 101

CMD ["nginx", "-g", "daemon off;"]
