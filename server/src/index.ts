import express from 'express';
import cors from 'cors';
import { prisma } from './db';
import cookieParser from "cookie-parser";
import { requireAuth } from './middleware/requireAuth';
import { requireRole } from './middleware/requireRole';
import authRouter from "./auth/auth.routes"
import multer from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/api/auth", authRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads');
const MAX_CAKE_IMAGE_SIZE = 5 * 1024 * 1024;

mkdirSync(UPLOAD_DIR, { recursive: true });

app.use('/api/uploads', express.static(UPLOAD_DIR, {
  maxAge: '7d',
  immutable: true,
}));

const cakeImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: MAX_CAKE_IMAGE_SIZE,
  },
});

function handleCakeImageUpload(req: Request, res: Response, next: NextFunction) {
  cakeImageUpload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Снимката трябва да е до 5 MB.',
      });
    }

    return res.status(400).json({
      error: 'Неуспешно качване на снимката.',
    });
  });
}

function getCakeImageExtension(file: Express.Multer.File): string | null {
  const bytes = file.buffer;

  if (
    file.mimetype === 'image/jpeg' &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'jpg';
  }

  if (
    file.mimetype === 'image/png' &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }

  if (
    file.mimetype === 'image/webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}


const VALID_BAKER_STATUSES = ['confirmed', 'in_progress', 'ready', 'picked_up'];

// ---- Catalog ----

app.get('/api/cakes', async (_req, res) => {
  const cakes = await prisma.cake.findMany({ orderBy: { id: 'asc' } });
  res.json(cakes);
});

app.get('/api/cakes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Невалидна торта.' });
  }

  const cake = await prisma.cake.findUnique({ where: { id } });

  if (!cake) {
    return res.status(404).json({ error: 'Тортата не е намерена.' });
  }

  return res.json(cake);
});


// ---- Orders ----

app.post('/api/orders', async (req, res) => {
  const {
    customerName,
    phone,
    items,
    notes,
    pickupDate,
  } = req.body ?? {};

  if (!customerName || !phone || !pickupDate) {
    return res.status(400).json({
      error: 'Липсват задължителни полета (име, телефон, дата).',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Добавете поне една торта.',
    });
  }

  const normalizedItems = items.map((item: any) => ({
    cakeId: Number(item.cakeId),
    quantity: Number(item.quantity),
  }));

  if (
    normalizedItems.some(
      item =>
        !Number.isInteger(item.cakeId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    )
  ) {
    return res.status(400).json({
      error: 'Невалидна торта или количество.',
    });
  }

  try {
    const cakeIds = normalizedItems.map(item => item.cakeId);

    const cakes = await prisma.cake.findMany({
      where: {
        id: {
          in: cakeIds,
        },
      },
    });

    if (cakes.length !== new Set(cakeIds).size) {
      return res.status(400).json({
        error: 'Една или повече торти не съществуват.',
      });
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        notes: notes ?? null,
        pickupDate: new Date(pickupDate),

        items: {
          create: normalizedItems.map(item => ({
            cakeId: item.cakeId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            cake: true,
          },
        },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Неуспешно създаване на поръчката.',
    });
  }
});

app.get('/api/orders', requireAuth, requireRole("STAFF", "MANAGER", "ADMIN"), async (req, res) => {
  const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;
  const day = dateParam ? new Date(dateParam) : new Date();

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      pickupDate: {
        gte: start,
        lte: end,
      },
      status: {
        in: ['confirmed', 'in_progress', 'ready'],
      },
    },
    include: {
      items: {
        include: {
          cake: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  res.json(orders);
});

app.patch('/api/orders/:id/status', requireAuth, requireRole("STAFF", "MANAGER", "ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!VALID_BAKER_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Невалиден статус.',
    });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: {
        include: {
          cake: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  res.json(order);
});

app.patch(
  '/api/orders/:orderId/items/:itemId/completed',
  requireAuth,
  requireRole("STAFF", "MANAGER", "ADMIN"),
  async (req, res) => {
    const orderId = Number(req.params.orderId);
    const itemId = Number(req.params.itemId);
    const { completedQuantity } = req.body ?? {};

    if (
      !Number.isInteger(orderId) ||
      !Number.isInteger(itemId) ||
      !Number.isInteger(completedQuantity)
    ) {
      return res.status(400).json({
        error: 'Невалидно количество.',
      });
    }

    try {
      const item = await prisma.orderItem.findFirst({
        where: { id: itemId, orderId },
      });

      if (!item) {
        return res.status(404).json({
          error: 'Тортата не е намерена в тази поръчка.',
        });
      }

      if (completedQuantity < 0 || completedQuantity > item.quantity) {
        return res.status(400).json({
          error: 'Завършеното количество трябва да е между 0 и поръчаното количество.',
        });
      }

      await prisma.orderItem.update({
        where: { id: itemId },
        data: { completedQuantity },
      });

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              cake: {
                include: {
                  recipe: {
                    include: {
                      ingredients: {
                        include: { ingredient: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          error: 'Поръчката не е намерена.',
        });
      }

      return res.json(order);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: 'Неуспешно обновяване на завършеното количество.',
      });
    }
  },
);

// ---- Cake Management ----

app.post(
  '/api/cakes',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  handleCakeImageUpload,
  async (req, res) => {
    let payload: any;

    try {
      payload = req.file
        ? JSON.parse(req.body.payload ?? 'null')
        : req.body ?? {};
    } catch {
      return res.status(400).json({
        error: 'Невалидни данни за тортата.',
      });
    }

    const {
      name,
      description,
      price,
      emoji,
      recipe,
    } = payload ?? {};

    if (!name || !description || price === undefined || !recipe?.name) {
      return res.status(400).json({
        error: 'Липсват задължителни полета.',
      });
    }

    const imageExtension = req.file
      ? getCakeImageExtension(req.file)
      : null;

    if (req.file && !imageExtension) {
      return res.status(400).json({
        error: 'Изберете валидна JPG, PNG или WebP снимка.',
      });
    }

    let savedImagePath: string | null = null;

    try {
      let imageUrl: string | null = null;

      if (req.file && imageExtension) {
        const fileName = `${randomUUID()}.${imageExtension}`;
        savedImagePath = path.join(UPLOAD_DIR, fileName);
        imageUrl = `/api/uploads/${fileName}`;
        await writeFile(savedImagePath, req.file.buffer, { flag: 'wx' });
      }

      const cake = await prisma.cake.create({
        data: {
          name,
          description,
          price: Number(price),
          emoji: emoji ?? "🎂",
          imageUrl,

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

      if (savedImagePath) {
        await unlink(savedImagePath).catch(() => undefined);
      }

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
    const action = req.body?.action ?? 'add';
    const amount = Number(quantity);

    if (
      !Number.isInteger(id) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !['add', 'remove'].includes(action)
    ) {
      return res.status(400).json({
        error: 'Невалидно количество или операция.',
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

      if (action === 'add') {
        const inventory = await prisma.inventory.upsert({
          where: { ingredientId: id },
          update: {
            quantity: { increment: amount },
          },
          create: {
            ingredientId: id,
            quantity: amount,
            lowStockThreshold: 0,
          },
          include: {
            ingredient: {
              include: { inventory: true },
            },
          },
        });

        return res.json(inventory.ingredient);
      }

      const updateResult = await prisma.inventory.updateMany({
        where: {
          ingredientId: id,
          quantity: { gte: amount },
        },
        data: {
          quantity: { decrement: amount },
        },
      });

      if (updateResult.count === 0) {
        return res.status(400).json({
          error: 'Наличността не може да бъде по-малка от 0.',
        });
      }

      const updatedIngredient = await prisma.ingredient.findUnique({
        where: { id },
        include: { inventory: true },
      });

      return res.json(updatedIngredient);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Неуспешно обновяване на наличността.',
      });
    }
  }
);

// order management

app.get(
  '/api/management/orders',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (_req, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: 'pending',
        },
        include: {
          items: {
            include: {
              cake: {
                include: {
                  recipe: {
                    include: {
                      ingredients: {
                        include: {
                          ingredient: {
                            include: {
                              inventory: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          {
            pickupDate: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = orders.map(order => {
        const pickupDate = new Date(order.pickupDate);
        pickupDate.setHours(0, 0, 0, 0);

        const daysUntilPickup = Math.round(
          (pickupDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        return {
          ...order,
          daysUntilPickup,
          isNearPickup: daysUntilPickup <= 2,
        };
      });

      res.json(result);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Неуспешно зареждане на поръчките.',
      });
    }
  }
);

app.get(
  '/api/management/orders/:id/availability',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              cake: {
                include: {
                  recipe: {
                    include: {
                      ingredients: {
                        include: {
                          ingredient: {
                            include: {
                              inventory: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          error: 'Поръчката не е намерена.',
        });
      }

      const ingredientMap = new Map<
        number,
        {
          ingredientId: number;
          name: string;
          unit: string;
          required: number;
          available: number;
          sufficient: boolean;
        }
      >();

      for (const item of order.items) {
        const recipe = item.cake.recipe;

        if (!recipe) {
          continue;
        }

        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = recipeIngredient.ingredient;

          const required =
            recipeIngredient.quantity * item.quantity;

          const existing = ingredientMap.get(ingredient.id);

          if (existing) {
            existing.required += required;
          } else {
            ingredientMap.set(ingredient.id, {
              ingredientId: ingredient.id,
              name: ingredient.name,
              unit: ingredient.unit,
              required,
              available: ingredient.inventory?.quantity ?? 0,
              sufficient:
                (ingredient.inventory?.quantity ?? 0) >= required,
            });
          }
        }
      }

      const ingredients = Array.from(ingredientMap.values()).map(
        ingredient => ({
          ...ingredient,
          sufficient:
            ingredient.available >= ingredient.required,
        })
      );

      res.json({
        orderId: order.id,
        available: ingredients.every(
          ingredient => ingredient.sufficient
        ),
        ingredients,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Неуспешна проверка на наличността.',
      });
    }
  }
);

app.patch(
  '/api/management/orders/:id/confirm',
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);

    try {
      const result = await prisma.$transaction(async tx => {
        const order = await tx.order.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                cake: {
                  include: {
                    recipe: {
                      include: {
                        ingredients: {
                          include: {
                            ingredient: {
                              include: {
                                inventory: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!order) {
          throw new Error('ORDER_NOT_FOUND');
        }

        if (order.status !== 'pending') {
          throw new Error('ORDER_NOT_PENDING');
        }

        const requiredIngredients = new Map<
          number,
          number
        >();

        for (const item of order.items) {
          const recipe = item.cake.recipe;

          if (!recipe) {
            throw new Error(
              `MISSING_RECIPE:${item.cake.name}`
            );
          }

          for (const recipeIngredient of recipe.ingredients) {
            const required =
              recipeIngredient.quantity * item.quantity;

            const current =
              requiredIngredients.get(
                recipeIngredient.ingredientId
              ) ?? 0;

            requiredIngredients.set(
              recipeIngredient.ingredientId,
              current + required
            );
          }
        }

        const ingredientIds = Array.from(
          requiredIngredients.keys()
        );

        const inventories = await tx.inventory.findMany({
          where: {
            ingredientId: {
              in: ingredientIds,
            },
          },
        });

        const inventoryMap = new Map(
          inventories.map(inventory => [
            inventory.ingredientId,
            inventory,
          ])
        );

        for (const [
          ingredientId,
          required,
        ] of requiredIngredients) {
          const inventory = inventoryMap.get(ingredientId);

          if (!inventory) {
            throw new Error(
              `MISSING_INVENTORY:${ingredientId}`
            );
          }

          if (inventory.quantity < required) {
            throw new Error(
              `INSUFFICIENT_STOCK:${ingredientId}`
            );
          }
        }

        for (const [
          ingredientId,
          required,
        ] of requiredIngredients) {
          await tx.inventory.update({
            where: {
              ingredientId,
            },
            data: {
              quantity: {
                decrement: required,
              },
            },
          });
        }

        return tx.order.update({
          where: {
            id,
          },
          data: {
            status: 'confirmed',
          },
          include: {
            items: {
              include: {
                cake: true,
              },
            },
          },
        });
      });

      res.json(result);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        if (error.message === 'ORDER_NOT_FOUND') {
          return res.status(404).json({
            error: 'Поръчката не е намерена.',
          });
        }

        if (error.message === 'ORDER_NOT_PENDING') {
          return res.status(400).json({
            error: 'Поръчката вече не е чакаща.',
          });
        }

        if (error.message.startsWith('MISSING_RECIPE:')) {
          return res.status(400).json({
            error: `Липсва рецепта за ${error.message.replace('MISSING_RECIPE:', '')}.`,
          });
        }

        if (error.message.startsWith('MISSING_INVENTORY:')) {
          return res.status(400).json({
            error: 'Липсва наличност за необходима съставка.',
          });
        }

        if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
          return res.status(400).json({
            error: 'Недостатъчна наличност за тази поръчка.',
          });
        }
      }

      res.status(500).json({
        error: 'Неуспешно потвърждаване на поръчката.',
      });
    }
  }
);


app.listen(PORT, () => {
  console.log(`🎂 GaBakery server running on http://localhost:${PORT}`);
});
