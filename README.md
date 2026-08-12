# Vitality

Vitality is a responsive personal health tracking and medication companion built as a production-oriented Netlify application. It gives authenticated users one private place to organize medications, daily activity, measurements, symptoms, mood, sleep, water, appointments, emergency information, notifications, reports, and a chronological health timeline.

The product is intentionally informational. It does not diagnose disease, prescribe medication, or replace qualified healthcare professionals.

## Key capabilities

- Netlify Identity sign-up, login, logout, password recovery, and private profiles
- User-scoped medication schedules, dose status history, reminders, and adherence views
- CRUD workflows for metrics, activities, water, sleep, symptoms, mood, appointments, and profile data
- One-minute daily health check-in
- Health timeline filters, private-record search, charts, analytics, and cautious generated insights
- Browser and in-app medication and appointment reminders
- Private appointment attachments stored in Netlify Blobs with authenticated download checks
- PDF and CSV health report exports
- Emergency card kept inside the authenticated application
- Dark and light themes, responsive desktop/mobile navigation, loading, empty, error, success, and confirmation states
- Clearly labeled fictional starter data for demonstrations

## Technology

- TanStack Start, React 19, TypeScript, and TanStack Router
- Tailwind CSS 4 plus a custom responsive design system
- Netlify Database (managed Postgres) with Drizzle ORM
- Netlify Identity via `@netlify/identity`
- Netlify Blobs for private appointment attachments
- Chart.js for health visualizations
- jsPDF for downloadable reports
- Zod for server-side request validation

## Local development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template and set the deployed Netlify site URL:

   ```bash
   cp .env.example .env
   ```

3. Start the Netlify development environment:

   ```bash
   netlify dev --port 8889
   ```

Netlify Identity authentication requires a deployed Netlify preview or production site. Use a branch deploy to test the full sign-up and login flow. The database is provisioned automatically, and migrations in `netlify/database/migrations/` are applied by Netlify during deployment.

## Environment variables

- `VITE_NETLIFY_SITE_URL`: Public URL of the deployed Netlify site used by the Identity integration.

No database connection string, JWT secret, or blob credentials are required in application code; Netlify configures these platform primitives in its runtime.

## Data and privacy notes

Every structured health record includes the authenticated Netlify Identity user ID and every API operation enforces that ownership boundary. Uploaded appointment files use user-prefixed object keys and can only be downloaded after the same account is authenticated. Exports contain sensitive user-entered information and should be handled carefully.

The architecture is a strong MVP foundation, but commercial healthcare deployment would still require formal privacy, security, legal, retention, audit, consent, and regulatory review.
