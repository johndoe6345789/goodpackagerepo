# syntax=docker/dockerfile:1.7
# Dev-mode Next.js — source baked in, next dev runs on start.
# Named volumes preserve node_modules + .next across restarts.
# Contexts: default=<service>, shared=shared

FROM node:20-alpine
ARG NPM_REGISTRY=
ARG NODE_OPTIONS=--max-old-space-size=2048
ENV NODE_OPTIONS=${NODE_OPTIONS}

COPY --from=shared . /build/shared/
WORKDIR /build/services/package-repository/root/frontend
COPY package.json package-lock.json* ./
RUN if [ -n "$NPM_REGISTRY" ]; then \
        npm config set registry "$NPM_REGISTRY"; \
    fi && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --prefer-offline --no-audit --no-fund
RUN ln -s \
    /build/services/package-repository/root/frontend/node_modules \
    /build/node_modules

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY . .

EXPOSE 3000
CMD ["npx", "next", "dev", "--turbopack"]
