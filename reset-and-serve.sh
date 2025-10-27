#!/usr/bin/env bash

npm cache clean --force

# rimuovi node_modules e lock se esistono
[ -d node_modules ] && rm -rf node_modules
[ -f package-lock.json ] && rm -f package-lock.json

npm install --no-audit --no-fund
npm run serve