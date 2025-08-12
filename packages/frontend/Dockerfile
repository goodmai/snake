# Stage 1: build static assets with Vite React TS
FROM node:20-alpine AS build
WORKDIR /app

# Install only what we need to build the frontend
COPY package.json ./
RUN npm install --no-save vite typescript @vitejs/plugin-react react react-dom

# Copy frontend package and shared tsconfig
COPY packages/frontend/package.json ./packages/frontend/package.json
COPY packages/frontend ./packages/frontend
COPY tsconfig.base.json ./tsconfig.base.json

# Ensure Vite uses TS entry and fails on JS shadowing
ENV NODE_ENV=production
WORKDIR /app/packages/frontend
RUN npx -y vite@latest build

# Stage 2: serve with nginx and proxy /api to bot
FROM nginx:1.27-alpine
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
