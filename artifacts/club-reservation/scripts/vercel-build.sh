#!/bin/sh
set -eu

PORT=3000 BASE_PATH=/ pnpm run build

rm -rf dist-vercel
mkdir -p dist-vercel
cp -R dist/public/. dist-vercel/

test -f dist-vercel/index.html