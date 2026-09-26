# FocusOS MVP

A deployable Next.js MVP for an ADHD-friendly personal operating system.

## Included

- Responsive dashboard
- Tasks with completion state
- Quick task capture
- Habits
- Goals and progress
- Energy check-in
- Focus timer
- Local browser persistence
- Mobile navigation
- Vercel-ready Next.js project

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push the complete contents of this folder to the `main` branch of your GitHub repository.
2. In Vercel, import the repository.
3. Framework Preset: Next.js.
4. Build Command: `next build` (default).
5. Output Directory: leave blank/default.
6. Do not add environment variables for this MVP.
7. Deploy.

## Important

This version intentionally uses localStorage so the first deployment has no database or API dependency. Supabase authentication/database and AI features can be added in the next phase.
