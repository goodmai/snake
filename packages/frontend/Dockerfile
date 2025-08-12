# Stage 1: build static assets
FROM node:20-alpine AS build
WORKDIR /app
# Install minimal build tooling without relying on yarn workspaces
COPY package.json ./
RUN npm install --no-save vite typescript
# Copy project and tsconfig base from monorepo root into container context
COPY . .
# Provide a local tsconfig.base.json so frontend tsconfig extends resolves
COPY ../../tsconfig.base.json ./tsconfig.base.json
# Rewrite extends in frontend tsconfig to use local file
RUN sed -i 's#\"../../tsconfig.base.json\"#\"./tsconfig.base.json\"#' tsconfig.json
RUN npx -y vite@latest build

# Stage 2: serve with nginx and proxy /api to bot
FROM nginx:1.27-alpine
# Copy static build
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config with /api proxy to bot service name
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
