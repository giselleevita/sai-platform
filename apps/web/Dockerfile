# Build and run the Next.js web app
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json turbo.json ./
COPY apps/web/package*.json apps/web/
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/risk-scoring/package*.json packages/risk-scoring/
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build only the web workspace
RUN npm run build -- --filter=web

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app/apps/web
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/next.config.ts ./next.config.ts
COPY --from=build /app/apps/web/package*.json ./
COPY --from=build /app/apps/web/public ./public 2>/dev/null || true
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
