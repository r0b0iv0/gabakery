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
