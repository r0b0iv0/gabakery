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
      include: {
        inventory: true,
      },
    });

    res.json(ingredients);
  }
);

app.post(
  '/api/ingredients',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (req, res) => {
    const {
      name,
      unit,
      description,
      quantity,
      lowStockThreshold,
    } = req.body ?? {};

    if (!name || !unit) {
      return res.status(400).json({
        error: 'Името и мерната единица са задължителни.',
      });
    }

    try {
      const ingredient = await prisma.ingredient.create({
        data: {
          name,
          unit,
          description: description ?? null,

          inventory: {
            create: {
              quantity: Number(quantity ?? 0),
              lowStockThreshold: Number(lowStockThreshold ?? 0),
            },
          },
        },
        include: {
          inventory: true,
        },
      });

      res.status(201).json(ingredient);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Неуспешно създаване на съставката.',
      });
    }
  }
);

app.patch(
  '/api/ingredients/:id',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);

    const {
      name,
      unit,
      description,
      lowStockThreshold,
    } = req.body ?? {};

    try {
      const ingredient = await prisma.ingredient.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),

          ...(unit !== undefined && { unit }),

          ...(description !== undefined && {
            description: description ?? null,
          }),

          ...(lowStockThreshold !== undefined && {
            inventory: {
              upsert: {
                update: {
                  lowStockThreshold: Number(lowStockThreshold),
                },
                create: {
                  quantity: 0,
                  lowStockThreshold: Number(lowStockThreshold),
                },
              },
            },
          }),
        },
        include: {
          inventory: true,
        },
      });

      res.json(ingredient);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Неуспешно обновяване на съставката.',
      });
    }
  }
);

app.patch(
  '/api/ingredients/:id/stock',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { quantity } = req.body ?? {};

    if (quantity === undefined || Number(quantity) <= 0) {
      return res.status(400).json({
        error: 'Количеството трябва да бъде по-голямо от 0.',
      });
    }

    try {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id },
        include: { inventory: true },
      });

      if (!ingredient) {
        return res.status(404).json({
          error: 'Съставката не е намерена.',
        });
      }

      const inventory = await prisma.inventory.upsert({
        where: {
          ingredientId: id,
        },
        update: {
          quantity: {
            increment: Number(quantity),
          },
        },
        create: {
          ingredientId: id,
          quantity: Number(quantity),
          lowStockThreshold: 0,
        },
        include: {
          ingredient: {
            include: {
              inventory: true,
            },
          },
        },
      });

      res.json(inventory.ingredient);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Неуспешно обновяване на наличността.',
      });
    }
  }
);


app.listen(PORT, () => {
  console.log(`🎂 GaBakery server running on http://localhost:${PORT}`);
});
