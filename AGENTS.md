# Vitality Architecture

## Project overview

Vitality is a TanStack Start application deployed on Netlify. It combines a polished React health dashboard with Netlify Identity, Netlify Database, and Netlify Blobs. The application is informational and must never present recorded values or generated patterns as diagnosis, treatment, or medical advice.

## Key directories

- `src/routes/index.tsx`: Landing page, authentication modal, demo entry, and authenticated app bootstrap.
- `src/components/HealthApp.tsx`: Main application shell and health feature views.
- `src/lib/health.ts`: Shared health data shape, fictional demo data, and API client.
- `src/lib/identity-context.tsx`: Browser authentication state for Netlify Identity.
- `src/routes/api/health.ts`: Authenticated database reads, seeding, validation, and CRUD actions.
- `src/routes/api/attachment.ts`: Authenticated private attachment upload and download.
- `db/schema.ts`: Drizzle schema for all relational health entities.
- `db/index.ts`: Netlify Database Drizzle client.
- `netlify/database/migrations/`: Deploy-time database migrations.
- `src/styles.css`: Global design system, responsive layouts, themes, and interaction states.

## Platform decisions

- Structured, queryable records use Netlify Database and always include `userId`.
- Appointment files use Netlify Blobs; they are never placed at public static URLs.
- Authentication uses only `@netlify/identity`. Do not add the deprecated Identity widget or GoTrue client.
- Identity works on deployed Netlify environments, not a plain local Vite server.
- New accounts receive clearly labeled fictional starter records to make the product demonstrable.
- Health Intelligence is deterministic summarization of user-recorded data. Preserve its visible medical disclaimer and prohibited-behavior boundaries.

## Coding conventions

- Use TypeScript and React function components.
- Keep API mutations validated and scoped to the authenticated user.
- Use camelCase in TypeScript and snake_case database column names.
- Keep visual tokens in CSS variables and preserve both dark and light themes.
- Maintain keyboard focus states, reduced-motion support, and mobile-first controls.
- Avoid public health-record URLs, client-provided user IDs, or unvalidated attachment types.
- Do not run schema DDL directly. Update `db/schema.ts`, then generate a named Drizzle migration in `netlify/database/migrations/`.

## Development commands

- `pnpm install`: Install dependencies.
- `netlify dev --port 8889`: Run the full Netlify development environment.
- `npx drizzle-kit generate --name <imperative_name>`: Generate a migration after schema changes.

Build and validation are handled by the deployment pipeline in this environment.
