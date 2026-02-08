# Next.js + Tailwind + Prisma + Neon Todo App

This project is now migrated to **Next.js (App Router)** with **Tailwind CSS**, using **Prisma ORM** and **Neon PostgreSQL**.

## Tech Stack

- Frontend: Next.js + React + Tailwind CSS
- Backend: Next.js Server Actions
- Database: Neon Postgres + Prisma
- Deployment: Vercel

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the project root:

```env
DATABASE_URL="your_neon_connection_string"
```

3. Push Prisma schema and generate client:

```bash
npm run prisma:push
npm run prisma:generate
```

4. Run locally:

```bash
npm run dev
```

Open http://localhost:3000

## Vercel Deployment

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add environment variable in Vercel:

```env
DATABASE_URL="your_neon_connection_string"
```

4. Deploy.
