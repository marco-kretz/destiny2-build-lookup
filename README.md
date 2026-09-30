# D2 Build Lookup

Compares popular DIM builds from [builders.gg](https://builders.gg/destiny/dim-builds/popular) with your Destiny 2 inventory and collections: which builds can you play, and which exotics are you missing?

## Setup

1. Create an app at https://www.bungie.net/en/Application
   - OAuth Client Type: **Confidential**
   - Redirect URL: `https://localhost:5180/auth/callback` (dev) or `https://<domain>/auth/callback` (prod). Bungie allows only one per app, so use two apps.
   - Scope: "Read your Destiny 2 information"
   - Origin Header: `*` or your domain
2. `cp .env.example .env` and fill in the values.
3. `npm install && npm run dev`, then open https://localhost:5180 and accept the self-signed certificate.

## Deploy (Coolify)

Build pack **Dockerfile**, port 3000.
Env: `BUNGIE_API_KEY`, `BUNGIE_CLIENT_ID`, `BUNGIE_CLIENT_SECRET`, `SESSION_SECRET`, `ORIGIN=https://<domain>`.
The item manifest (~60 MB JSON) is loaded into memory on first request; plan for ~512 MB RAM.
