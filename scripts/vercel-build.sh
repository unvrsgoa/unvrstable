#!/bin/sh
set -eu

PORT=3000 BASE_PATH=/ pnpm --filter @workspace/club-reservation run build

rm -rf dist-vercel
mkdir -p dist-vercel
cp -R artifacts/club-reservation/dist/public/. dist-vercel/

test -f dist-vercel/index.html