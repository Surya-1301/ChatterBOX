# docs

This folder contains the project's documentation and blueprints.

Contents:

- `blueprint.md` — design notes and architecture decisions for ChatterBox (present in this folder).

What to document here:

- API contracts for `POST /api/auth/*`, `/api/users`, and `/api/messages` (examples and expected payloads).
- Deployment notes for Vercel / Netlify / Render (environment variables, build commands).
- Operational runbook: how to rotate `JWT_SECRET`, how to update the MongoDB connection string, and how to disable AI plugins if keys are missing.

Suggested improvements:

- Add an `API.md` or an OpenAPI spec describing request/response shapes for each server endpoint.
- Add a `DEPLOYMENT.md` covering how to deploy to Vercel (recommended) and how to set environment variables there.

If you want, I can generate an API spec from the current server code and add it here.
