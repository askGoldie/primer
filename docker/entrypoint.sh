#!/bin/sh
#
# Container entrypoint for the Primer app service.
#
# 1. Apply pending migrations against DATABASE_URL. Migrations are
#    idempotent — already-applied files are skipped.
# 2. On first boot only (PRIMER_SEED_ON_BOOT=true and no marker file),
#    run the seed script. Failures here are non-fatal so a re-seed
#    against a partially-populated database doesn't crash-loop the
#    container — the app is still usable, just without demo data.
# 3. exec the SvelteKit Node server so it becomes PID 1 and receives
#    SIGTERM cleanly when Compose stops the container.
#
set -e

echo "[primer] running migrations…"
npx tsx scripts/migrate.ts

if [ "$PRIMER_SEED_ON_BOOT" = "true" ] && [ ! -f /tmp/primer-seeded ]; then
  echo "[primer] running seed…"
  npx tsx scripts/seed.ts || echo "[primer] seed failed; continuing"
  touch /tmp/primer-seeded
fi

echo "[primer] starting server on port ${PORT:-3000}…"
exec node build
