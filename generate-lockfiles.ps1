$ErrorActionPreference = "Stop"

Write-Host "Generating package-lock.json files using Dockerized Node..."

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Backend lockfile
Write-Host "-> backend/package-lock.json"
docker run --rm -v "${root}/backend:/app" -w /app node:20-alpine npm install --package-lock-only

# Frontend lockfile
Write-Host "-> frontend/package-lock.json"
docker run --rm -v "${root}/frontend:/app" -w /app node:20-alpine npm install --package-lock-only

Write-Host "Done. Lockfiles generated."
