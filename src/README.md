# src — application source

This directory contains the Next.js application (App Router) and all UI components, hooks, and server helpers used by ChatterBox.

Top-level folders:

- `app/` — Next.js app routes and pages built with the App Router. Server and client components live here.
- `components/` — reusable UI components grouped by domain (auth, chat, ui controls).
- `hooks/` — custom React hooks (device detection, toast helper).
- `lib/` — small server/client helpers such as `mongodb.ts` and optional `realm.ts` fallback.

Key files to know:

- `src/lib/mongodb.ts` — MongoDB client helper with connection caching.
- `src/pages/api/` — Next.js API routes (auth, users, messages) used by the client.
- `src/components/chat/` — chat UI including `chat.tsx`, `chat-layout.tsx`, `message-list.tsx`, `message-input.tsx`, and `user-list.tsx`.

Auth and messaging flow:

- Client calls `POST /api/auth/signup` and `POST /api/auth/login` to create accounts and receive JWTs.
- Auth token is stored client-side (localStorage) and used for authenticated calls to the API.
- Messages are created by `POST /api/messages` and fetched with `GET /api/messages?conversationId=...`.

Running and debugging notes:

- Use `npm run dev` to run the Next.js dev server. Make sure `.env.local` contains `MONGODB_URI` and `JWT_SECRET`.
- If the server fails to start due to AI plugins (genkit), either set the required API keys or temporarily comment/guard the AI initialization in `src/ai/`.

If you'd like I can also add small diagrams or an OpenAPI spec for the API endpoints.
