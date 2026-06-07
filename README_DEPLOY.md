Deployment runbook
==================

This file collects the exact commands and CI steps to finish deployment of the Medical Sales Rep CRM.

Quick summary
-------------
- A GitHub Action runs Prisma migrations (uses secret DATABASE_URL). Ensure that secret is set.
- Vercel deploy can be automated via a workflow if VERCEL_TOKEN is provided as a GitHub secret. Otherwise deploy via Vercel UI/CLI.

How to run migrations locally
----------------------------
1. From your machine with DB access:

   PowerShell:

     $env:DATABASE_URL = "postgresql://<user>:<pass>@<host>:5432/<db>"
     $env:DIRECT_URL = $env:DATABASE_URL
     cd backend
     npm ci
     npx prisma migrate deploy
     npx prisma generate

2. Or add DATABASE_URL as a GitHub Actions secret and let the workflow run automatically.

Automated CI deploy (optional)
------------------------------
Create these GitHub secrets in your repository (Settings → Secrets → Actions):
- DATABASE_URL (required for migrations)
- VERCEL_TOKEN (optional, required for automatic Vercel deploy)
- VERCEL_PROJECT_ID (optional)

The repository contains a workflow (ci-deploy.yml) that will:
1. Run prisma migrate deploy using DATABASE_URL.
2. Build the frontend.
3. If VERCEL_TOKEN is present, deploy to Vercel.

If you prefer manual control, use Vercel UI to deploy and add env vars there instead.

If you need help, paste action logs here and I'll triage.
