# Multi-stage prod Dockerfile for pkgrepo Next.js frontend.
# Mirrors frontend/Dockerfile: deps -> build -> slim runtime
# running `node server.js` standalone (~150 MB runtime).
# basePath /repo (set NEXT_BASE_PATH at build).

ARG NODE_IMAGE=node:22-slim
ARG RUNTIME_IMAGE=debian:sid-slim

# -- Stage 1: deps -----------------------------------------
FROM ${NODE_IMAGE} AS deps
ARG NPM_REGISTRY=https://registry.npmjs.org
ENV NPM_CONFIG_REGISTRY=$NPM_REGISTRY
ARG NODE_OPTIONS=--max-old-space-size=1024
ENV NODE_OPTIONS=${NODE_OPTIONS}
# Stage `shared` at the path the package.json file: deps
# expect (../../../../shared from the frontend dir).
COPY --from=shared . /build/shared/
WORKDIR /build/services/package-repository/root/frontend
COPY package.json package-lock.json* ./
RUN npm ci || npm install
# Hoist node_modules so /build/shared/*.tsx imports of
# 'react' resolve via the upward node_modules walk (mirrors
# the main frontend's ln in frontend/Dockerfile).
RUN ln -s /build/services/package-repository/root/frontend/node_modules /build/node_modules

# -- Stage 2: build ----------------------------------------
FROM deps AS build
ARG NEXT_BASE_PATH=/repo
ARG BACKEND_URL=http://pkgrepo-backend:5000
ARG SRC_BUST=1
WORKDIR /build/services/package-repository/root/frontend
RUN echo "src bust: ${SRC_BUST}"
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_BASE_PATH}
ENV BACKEND_URL=${BACKEND_URL}
RUN npm run build

# -- Stage 3: runner ---------------------------------------
ARG RUNTIME_IMAGE
FROM ${RUNTIME_IMAGE} AS runner
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nodejs ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs
# standalone output mirrors outputFileTracingRoot (/build/)
# so server.js lives at .next/standalone/services/
# package-repository/root/frontend/.
COPY --from=build \
    /build/services/package-repository/root/frontend/public \
    ./public
COPY --from=build --chown=nextjs:nodejs \
    /build/services/package-repository/root/frontend/.next/standalone/services/package-repository/root/frontend/ \
    ./
COPY --from=build --chown=nextjs:nodejs \
    /build/services/package-repository/root/frontend/.next/static \
    ./.next/static
# Include the workspace's hoisted node_modules that the
# standalone server.js requires from the monorepo root.
COPY --from=build --chown=nextjs:nodejs \
    /build/services/package-repository/root/frontend/.next/standalone/node_modules/ \
    /app/node_modules/
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
