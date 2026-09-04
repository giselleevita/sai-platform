# Build and run the API as a standalone container
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev pixman-dev openssl
COPY package*.json turbo.json ./
COPY apps/api/package*.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/risk-scoring/package*.json packages/risk-scoring/
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
# Build only the API package (workspace aware)
RUN npm run build -- --filter=@sai/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache cairo pango jpeg giflib pixman openssl
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./node_modules
# node_modules/@sai/* are workspace symlinks into packages/. Without the
# packages themselves those links dangle and the container crash-loops on
# Cannot find module '@sai/risk-scoring' as soon as a route is required.
COPY --from=build /app/packages/risk-scoring/package.json ./packages/risk-scoring/package.json
COPY --from=build /app/packages/risk-scoring/dist ./packages/risk-scoring/dist
COPY --from=build /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
