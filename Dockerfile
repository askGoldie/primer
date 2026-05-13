# syntax=docker/dockerfile:1.7
#
# Primer — multi-stage container image
#
# Stage 1 ("build"): installs dev + prod dependencies, builds the SvelteKit
# app with @sveltejs/adapter-node, and prunes node_modules to production.
#
# Stage 2 ("runtime"): copies just the build artefacts and the pruned
# node_modules into a fresh node:20-alpine image. The result is a small,
# non-root runtime image that has no toolchain inside it.

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first so this layer caches across code-only changes.
# The trailing `npm install --no-save` repairs platform-specific optional
# dependencies (e.g. Rollup native binaries) that `npm ci` skips when the
# build container's OS/arch differs from the host where package-lock.json
# was generated — npm bug #4828. Without this, `npm run build` below fails
# with "Cannot find module @rollup/rollup-linux-x64-gnu" (or the matching
# binary for the customer's Docker host arch). `--no-save` keeps the
# shipped lockfile unchanged.
COPY package.json package-lock.json ./
RUN npm ci && npm install --no-save --no-audit --no-fund

# Build the app, then drop dev deps from node_modules.
COPY . .
RUN npm run build && npm prune --production

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what production needs.
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/seeds ./seeds
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json

# Run as a non-root user — defence-in-depth against escape bugs in node.
RUN addgroup -S primer && adduser -S primer -G primer
USER primer

EXPOSE 3000

# Entrypoint runs migrations (always) and seed (first boot only),
# then starts the SvelteKit Node server.
COPY --chown=primer:primer docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
