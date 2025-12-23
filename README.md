# Circle Feed

Circle Feed is a small Next.js app for running private invite-only groups. People join with a display name, admins can post updates (with optional videos), and everyone can comment or drop emoji reactions.

## Features

- Create groups with friendly slugs and optional passwords.
- Session-based access per group using HTTP-only cookies.
- Set a display name (and optional email) before participating.
- Admins can publish posts with text, titles, and stubbed video uploads.
- Members can add comments and emoji reactions, and admins can moderate comments and members.
- Built with shadcn/ui components and Tailwind CSS 4.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/your-org/circle-feed
cd circle-feed
pnpm install
```

Copy the environment example and fill in your Postgres connection string:

```bash
cp env.example .env
# edit .env to set POSTGRES_URL (and other env vars as needed)
```

### Database setup

With Postgres running and `POSTGRES_URL` configured, generate and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

You can inspect your data with:

```bash
pnpm db:studio
```

### Run the app

Start the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to create or join a circle.

### Deploying

1. `POSTGRES_URL`: Set this to your production database URL.
2. `BLOB_READ_WRITE_TOKEN`: Needed for uploading media to Vercel Blob storage (used by `@vercel/blob`).
3. `APP_URL`: Your public site URL (used for absolute links in emails).
4. `RESEND_API_KEY`: Resend API key.
5. `RESEND_FROM`: Verified sending identity (e.g. `Trippi <[email protected]>`).
6. `EMAIL_LINK_SECRET`: Random string used to sign email links (auto-login + unsubscribe).
7. `CRON_SECRET`: Random string used to protect the daily email cron endpoint.

### Daily email notifications (cron)

The posts update email job is exposed at `GET /api/cron/posts-update`.

- **Auth**:
  - On Vercel Cron, requests include `x-vercel-cron: 1` (accepted automatically), and `vercel.json` schedules it.
  - For manual triggering, send either `Authorization: Bearer $CRON_SECRET` or add `?key=$CRON_SECRET` to the URL.
- **What it does**: Finds posts from the last 24 hours and emails all `group_members` that have an `email` and `email_notifications_enabled = true`.
- **Unsubscribe**: Emails include an unsubscribe link that sets `group_members.email_notifications_enabled = false` and records `email_unsubscribed_at`.

You can trigger it manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/posts-update"
```

When deploying (e.g., to Vercel), add the same `POSTGRES_URL` environment variable in your project settings so the app can reach your production database.

## Other Templates

If you want a more feature-rich starter, consider:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
