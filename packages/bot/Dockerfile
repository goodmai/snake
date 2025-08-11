# 1. Этап сборки (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/bot/package.json ./packages/bot/
RUN yarn install --frozen-lockfile
COPY packages/bot/ ./packages/bot/
COPY tsconfig.base.json .
RUN yarn workspace bot build

# 2. Этап запуска (Production)
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/bot/package.json ./packages/bot/
RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/packages/bot/dist ./dist
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck без внешних утилит (используем Node http)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

EXPOSE 3001
CMD ["node", "dist/index.js"]

