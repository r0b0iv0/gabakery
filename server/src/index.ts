import express from 'express';
import cors from 'cors';
import { prisma } from './db';
import cookieParser from "cookie-parser";
import { requireAuth } from './middleware/requireAuth';
import { requireRole } from './middleware/requireRole';
import authRouter from "./auth/auth.routes"

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/api/auth", authRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;


const VALID_STATUSES = ['pending', 'confirmed', 'in_progress', 'ready', 'picked_up'];

// ---- Catalog ----

app.get('/api/cakes', async (_req, res) => {
  const cakes = await prisma.cake.findMany({ orderBy: { id: 'asc' } });
  res.json(cakes);
});


// ---- Orders ----

app.post('/api/orders', async (req, res) => {
  const {
    customerName,
    phone,
    cakeId,
    quantity,
    notes,
    pickupDate,
  } = req.body ?? {};

  if (!customerName || !phone || !pickupDate) {
    return res.status(400).json({ error: 'Липсват задължителни полета (име, телефон, дата).' });
  }

  if (!cakeId) {
    return res.status(400).json({ error: 'Изберете торта от каталога' });
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      phone,
      cakeId: Number(cakeId),
      quantity: quantity,
      notes: notes ?? null,
      pickupDate: new Date(pickupDate),
    },
    include: { cake: true },
  });

  res.status(201).json(order);
});

// GET /api/orders?date=YYYY-MM-DD  -> orders due that day (defaults to today)
app.get('/api/orders', requireAuth, requireRole("STAFF", "ADMIN"), async (req, res) => {
  const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;
  const day = dateParam ? new Date(dateParam) : new Date();

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: { pickupDate: { gte: start, lte: end } },
    include: { cake: true },
    orderBy: { createdAt: 'asc' },
  });

  res.json(orders);
});

app.patch('/api/orders/:id/status', requireAuth, requireRole("STAFF", "ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Невалиден статус.' });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { cake: true },
  });

  res.json(order);
});

// ---- Cake Management ----

app.post(
  '/api/cakes',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (req, res) => {
    const {
      name,
      description,
      price,
      emoji,
      recipe,
    } = req.body ?? {};

    if (!name || !description || price === undefined || !recipe?.name) {
      return res.status(400).json({
        error: 'Липсват задължителни полета.',
      });
    }

    try {
      const cake = await prisma.cake.create({
        data: {
          name,
          description,
          price: Number(price),
          emoji: emoji ?? "🎂",

          recipe: {
            create: {
              name: recipe.name,
              description: recipe.description ?? null,

              ingredients: {
                create: (recipe.ingredients ?? []).map((item: any) => ({
                  ingredientId: Number(item.ingredientId),
                  quantity: Number(item.quantity),
                })),
              },
            },
          },
        },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(cake);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Неуспешно създаване на тортата.',
      });
    }
  }
);

app.get(
  '/api/ingredients',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (_req, res) => {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(ingredients);
  }
);


app.listen(PORT, () => {
  console.log(`🎂 GaBakery server running on http://localhost:${PORT}`);
});
