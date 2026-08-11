#!/bin/sh
# Patch node_modules for riscv64/ppc64le where SWC has
# no native binary. Stubs @parcel/watcher and patches
# @swc/core to use the WASM fallback.

set -e

NM="node_modules"

echo "[patch] Stubbing @parcel/watcher ..."
mkdir -p "$NM/@parcel/watcher"
cat > "$NM/@parcel/watcher/package.json" <<'EOJSON'
{"name":"@parcel/watcher","main":"index.js"}
EOJSON
cat > "$NM/@parcel/watcher/index.js" <<'EOJS'
exports.subscribe=async()=>({unsubscribe:async()=>{}});
exports.getEventsSince=async()=>[];
EOJS

echo "[patch] Installing @swc/wasm fallback ..."
npm install --no-save @swc/wasm 2>&1 | tail -3

echo "[patch] Patching @swc/core bindings ..."
find "$NM" -path '*/@swc/core/binding.js' \
    -exec sh -c \
    'echo "module.exports=require(\"@swc/wasm\");" > "$1"' \
    _ {} \;

echo "[patch] Done"
