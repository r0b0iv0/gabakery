# GaBakery — Prototype

Small end-to-end prototype: customers order a premade or custom cake for a
pickup date; bakers see everything due on a given day.

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

## What's here vs. deliberately skipped

- No auth — you said skip it for now. Both routes are open.
- Custom cake toppings/flavors are a hardcoded list served from
  `GET /api/options` rather than DB tables, since they're not the thing
  you're validating yet.
- No email/SMS confirmation — order just gets an ID.
- No payment.

## What I'd extend first

1. **Separate baker app** — you flagged this yourself. Once the flow feels
   right, split `/baker` into its own Vite app (or just its own deployed
   build of the same client) with a simple PIN/login, since kitchen staff
   and customers have very different needs (kitchen wants a big-print,
   glanceable queue; customers want a nice ordering flow).
2. **Capacity limits** — right now the bakery can accept infinite orders for
   the same day. Next real feature: cap total kg or number of cakes per day
   and grey out full dates in the date picker.
3. **Move flavors/toppings into the DB** — once you're happy with the set,
   turn `OPTIONS` in `server/src/index.ts` into actual `Flavor`/`Topping`
   tables so non-devs can manage them (and so premade cakes can eventually
   be *built from* the same ingredient list).
4. **Order editing/cancellation** — currently one-way; customers can't
   change or cancel once submitted.
5. **Swap SQLite → Postgres** — only `datasource` in `schema.prisma` and
   `DATABASE_URL` change; Prisma does the rest. Worth doing once you deploy
   somewhere with concurrent writers.
6. **Notifications** — SMS/email when status flips to `ready`, since that's
   the main promise of this whole system to the customer.
