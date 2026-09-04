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
# NEXT_PUBLIC_* values are inlined by next build, so they have to arrive as
# build arguments. Passing them at run time does nothing for a production
# build. Leave them unset outside a demo and the login page shows no
# credentials at all.
# Rewrite destinations are baked into the build, so the API origin has to be
# known here rather than at run time.
ARG API_ORIGIN="http://localhost:3001"
ENV API_ORIGIN=$API_ORIGIN
ARG NEXT_PUBLIC_DEMO_EMAIL=""
ARG NEXT_PUBLIC_DEMO_PASSWORD=""
ENV NEXT_PUBLIC_DEMO_EMAIL=$NEXT_PUBLIC_DEMO_EMAIL
ENV NEXT_PUBLIC_DEMO_PASSWORD=$NEXT_PUBLIC_DEMO_PASSWORD
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
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
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
