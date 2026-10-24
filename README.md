# GaBakery

Small end-to-end web app: customers order a premade cake for a
pickup date; bakers see everything due on a given day; managers confirm and take care of the orders and ingredients.

## Stack
- **Client:** React + TypeScript + Vite
- **Server:** Express + TypeScript
- **DB/ORM:** SQLite + Prisma

## 1. Server setup

```bash
cd server
npm install
npx prisma migrate dev --name init   # creates dev.db and applies the schema
npm run prisma:seed                  # loads the 6 sample cakes
npm run dev                          # http://localhost:4000
```

### Password reset emails with Gmail

The forgot-password endpoint uses Nodemailer to send real email through Gmail SMTP. Turn on 2-Step Verification for your Google account, create an App Password, then add `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `APP_BASE_URL` to `server/.env` (see `.env.example`). Do not use your regular Google password, and keep the app password server-side. The server removes spaces from the app password if Google displays it in groups.

Submit the forgot-password form using the email address of an existing GaBakery user. The reset email will arrive in that user's inbox, and its link returns to `APP_BASE_URL` (defaults to `http://localhost:5173`). This sends real email, so use it for local testing with your own addresses; Gmail may block sign-ins it considers unusual. Nodemailer's current release requires Node.js 20 or newer.

## 2. Client setup (in a second terminal)

```bash
cd client
npm install
npm run dev                          # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:4000`, so just open
`http://localhost:5173` — no CORS config needed on your end.

## 3. Try it

- `/` — pick a premade cake or build a custom one, choose a pickup date,
  submit.
- `/baker` — pick a date (defaults to today) and see every order due then,
  with a status dropdown (pending → in_progress → ready → picked_up).
