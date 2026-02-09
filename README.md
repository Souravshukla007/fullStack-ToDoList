# ✨ Memoirly - A Full-Stack Smart Todo App

A modern and beautiful **Todo List Web App** built with **Next.js App Router**, **Prisma**, and **PostgreSQL (Neon)**.

It includes authentication, analytics, recurring tasks, subtasks, priority filters, pinned tasks, and even a motivational quote system to keep you productive 🚀

---

## 🚀 Features

- 🔐 **Authentication** (Sign up / Login / Logout) using secure JWT cookies
- ✅ **Task Management**: Create, update, delete, complete tasks
- 📌 **Pin Important Tasks** and reorder with move up/down controls
- 🧩 **Subtasks** support per todo item
- 🗂️ **Category + Priority + Due Date** organization
- 🔁 **Recurring Tasks** (daily / weekly)
- 📊 **Analytics Dashboard** (weekly completion + streaks)
- 💬 **Daily Motivational Quotes** (with fallback and favorites)
- 🎨 Responsive UI with Tailwind CSS + clean modern design

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Next.js Server Actions + Route Handlers
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Auth:** JWT + `jose`, password hashing with `bcryptjs`
- **Deployment:** Vercel (recommended)

---

## 📦 Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

Create a `.env` file in the project root:

```env
DATABASE_URL="your_neon_connection_string"
AUTH_SECRET="replace_with_a_secure_random_secret"
```

> `AUTH_SECRET` is strongly recommended so your session JWTs are secure.

### 3) Initialize database and Prisma client

```bash
npm run prisma:push
npm run prisma:generate
```

### 4) Start development server

```bash
npm run dev
```

Now open: **http://localhost:3000**

---

## 📁 Project Structure (high level)

```txt
app/
  page.js                 # Main todo dashboard
  analytics/page.js       # Analytics and streak insights
  login/page.js           # Login UI
  signup/page.js          # Signup UI
  actions.js              # Todo + subtask server actions
  auth-actions.js         # Auth server actions
  api/quotes/random       # Motivational quote API route
lib/
  auth.js                 # Session and JWT helpers
  prisma.js               # Prisma client singleton
prisma/
  schema.prisma           # Database schema
```

---

## 📜 Available Scripts

```bash
npm run dev              # Run app in development
npm run build            # Prisma generate + Next.js production build
npm run start            # Start production server
npm run prisma:push      # Push schema changes to DB
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Deploy Prisma migrations
```

---

## 🌐 Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Add environment variables in Vercel:

```env
DATABASE_URL="your_neon_connection_string"
AUTH_SECRET="replace_with_a_secure_random_secret"
```

4. Deploy 🎉

---

## 🙌 Author

Built by **Sourav Shukla**.

If you like this project, consider starring the repo ⭐
