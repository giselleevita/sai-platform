# Build and run the API as a standalone container
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev pixman-dev
COPY package*.json turbo.json ./
COPY apps/api/package*.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/risk-scoring/package*.json packages/risk-scoring/
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build only the API package (workspace aware)
RUN npm run build -- --filter=@sai/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache cairo pango jpeg giflib pixman
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/main.js"]
