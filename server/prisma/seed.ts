import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pickupDate(daysFromToday: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(12, 0, 0, 0);
  return date;
}

async function main() {
  await prisma.order.deleteMany();
  await prisma.cake.deleteMany();

  const cakes = [
    {
      name: 'Шоколадова наслада',
      description: 'Блатове с тъмен шоколад и ганаш',
      price: 45,
      emoji: '🍫',
    },
    {
      name: 'Ванилова мечта',
      description: 'Ванилов блат с крем и пресни ягоди',
      price: 40,
      emoji: '🍓',
    },
    {
      name: 'Лимонов бриз',
      description: 'Лек лимонов блат с меринга',
      price: 42,
      emoji: '🍋',
    },
    {
      name: 'Червено кадифе',
      description: 'Класическа Red Velvet с крем сирене',
      price: 48,
      emoji: '❤️',
    },
    {
      name: 'Ядкова еуфория',
      description: 'Блат с лешници и карамел',
      price: 50,
      emoji: '🌰',
    },
    {
      name: 'Oreo мечта',
      description: 'Шоколадов блат с бисквити Oreo',
      price: 46,
      emoji: '🍪',
    },
  ];

  await prisma.cake.createMany({ data: cakes });

  const ingredients = [
    { name: 'Flour', unit: 'g', quantity: 15000, lowStockThreshold: 2500 },
    { name: 'Sugar', unit: 'g', quantity: 12000, lowStockThreshold: 2000 },
    { name: 'Butter', unit: 'g', quantity: 8000, lowStockThreshold: 1500 },
    { name: 'Eggs', unit: 'pcs', quantity: 120, lowStockThreshold: 24 },
    { name: 'Milk', unit: 'ml', quantity: 7000, lowStockThreshold: 1500 },
    { name: 'Chocolate', unit: 'g', quantity: 5000, lowStockThreshold: 1000 },
    { name: 'Cocoa', unit: 'g', quantity: 1500, lowStockThreshold: 300 },
    { name: 'Cream', unit: 'ml', quantity: 8000, lowStockThreshold: 1500 },
    { name: 'Vanilla', unit: 'ml', quantity: 500, lowStockThreshold: 100 },
    { name: 'Baking powder', unit: 'g', quantity: 500, lowStockThreshold: 100 },
    { name: 'Salt', unit: 'g', quantity: 500, lowStockThreshold: 50 },
    { name: 'Strawberries', unit: 'g', quantity: 4000, lowStockThreshold: 800 },
    { name: 'Lemon juice', unit: 'ml', quantity: 3000, lowStockThreshold: 600 },
    { name: 'Lemon zest', unit: 'g', quantity: 500, lowStockThreshold: 100 },
    { name: 'Cream cheese', unit: 'g', quantity: 5000, lowStockThreshold: 1000 },
    { name: 'Vinegar', unit: 'ml', quantity: 1000, lowStockThreshold: 200 },
    { name: 'Hazelnuts', unit: 'g', quantity: 3000, lowStockThreshold: 600 },
    { name: 'Caramel sauce', unit: 'g', quantity: 4000, lowStockThreshold: 800 },
    { name: 'Oreo biscuits', unit: 'g', quantity: 5000, lowStockThreshold: 1000 },
  ];

  const ingredientIds = new Map<string, number>();

  for (const ingredient of ingredients) {
    const savedIngredient = await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: { unit: ingredient.unit },
      create: {
        name: ingredient.name,
        unit: ingredient.unit,
      },
    });

    ingredientIds.set(savedIngredient.name, savedIngredient.id);

    await prisma.inventory.upsert({
      where: { ingredientId: savedIngredient.id },
      update: {
        quantity: ingredient.quantity,
        lowStockThreshold: ingredient.lowStockThreshold,
      },
      create: {
        ingredientId: savedIngredient.id,
        quantity: ingredient.quantity,
        lowStockThreshold: ingredient.lowStockThreshold,
      },
    });
  }

  const recipes = [
    {
      cakeName: 'Шоколадова наслада',
      name: 'Шоколадови блатове с ганаш',
      description: 'Шоколадови блатове, покрити с ганаш.',
      ingredients: [
        { name: 'Flour', quantity: 300 },
        { name: 'Sugar', quantity: 250 },
        { name: 'Butter', quantity: 180 },
        { name: 'Eggs', quantity: 4 },
        { name: 'Chocolate', quantity: 250 },
        { name: 'Cocoa', quantity: 50 },
        { name: 'Cream', quantity: 200 },
        { name: 'Baking powder', quantity: 8 },
        { name: 'Salt', quantity: 2 },
      ],
    },
    {
      cakeName: 'Ванилова мечта',
      name: 'Ванилов блат с ягоди',
      description: 'Ванилов блат с крем и пресни ягоди.',
      ingredients: [
        { name: 'Flour', quantity: 300 },
        { name: 'Sugar', quantity: 220 },
        { name: 'Butter', quantity: 160 },
        { name: 'Eggs', quantity: 4 },
        { name: 'Milk', quantity: 180 },
        { name: 'Vanilla', quantity: 8 },
        { name: 'Strawberries', quantity: 300 },
        { name: 'Cream', quantity: 200 },
        { name: 'Baking powder', quantity: 8 },
      ],
    },
    {
      cakeName: 'Лимонов бриз',
      name: 'Лимонов блат с меринг',
      description: 'Лимонов блат с лек меринг.',
      ingredients: [
        { name: 'Flour', quantity: 280 },
        { name: 'Sugar', quantity: 280 },
        { name: 'Butter', quantity: 150 },
        { name: 'Eggs', quantity: 5 },
        { name: 'Lemon juice', quantity: 80 },
        { name: 'Lemon zest', quantity: 8 },
        { name: 'Baking powder', quantity: 8 },
        { name: 'Salt', quantity: 2 },
      ],
    },
    {
      cakeName: 'Червено кадифе',
      name: 'Червено кадифе с крем сирене',
      description: 'Какаов блат с крем от сирене.',
      ingredients: [
        { name: 'Flour', quantity: 300 },
        { name: 'Sugar', quantity: 250 },
        { name: 'Butter', quantity: 150 },
        { name: 'Eggs', quantity: 3 },
        { name: 'Cocoa', quantity: 20 },
        { name: 'Milk', quantity: 240 },
        { name: 'Cream cheese', quantity: 250 },
        { name: 'Vinegar', quantity: 10 },
        { name: 'Vanilla', quantity: 5 },
        { name: 'Baking powder', quantity: 8 },
      ],
    },
    {
      cakeName: 'Ядкова еуфория',
      name: 'Лешников блат с карамел',
      description: 'Блат с лешници и карамелен сос.',
      ingredients: [
        { name: 'Flour', quantity: 250 },
        { name: 'Sugar', quantity: 180 },
        { name: 'Butter', quantity: 150 },
        { name: 'Eggs', quantity: 3 },
        { name: 'Hazelnuts', quantity: 180 },
        { name: 'Caramel sauce', quantity: 120 },
        { name: 'Cream', quantity: 100 },
        { name: 'Baking powder', quantity: 8 },
      ],
    },
    {
      cakeName: 'Oreo мечта',
      name: 'Шоколадов блат с Oreo',
      description: 'Шоколадов блат с крем и бисквити Oreo.',
      ingredients: [
        { name: 'Flour', quantity: 280 },
        { name: 'Sugar', quantity: 220 },
        { name: 'Butter', quantity: 150 },
        { name: 'Eggs', quantity: 4 },
        { name: 'Cocoa', quantity: 40 },
        { name: 'Milk', quantity: 180 },
        { name: 'Cream', quantity: 200 },
        { name: 'Cream cheese', quantity: 200 },
        { name: 'Oreo biscuits', quantity: 180 },
        { name: 'Baking powder', quantity: 8 },
      ],
    },
  ];

  const cakesByName = new Map(
    (await prisma.cake.findMany()).map((cake) => [cake.name, cake]),
  );

  for (const recipe of recipes) {
    const cake = cakesByName.get(recipe.cakeName);

    if (!cake) {
      throw new Error(`Cake not found for recipe: ${recipe.cakeName}`);
    }

    await prisma.recipe.create({
      data: {
        cakeId: cake.id,
        name: recipe.name,
        description: recipe.description,
        ingredients: {
          create: recipe.ingredients.map((recipeIngredient) => {
            const ingredientId = ingredientIds.get(recipeIngredient.name);

            if (ingredientId === undefined) {
              throw new Error(`Ingredient not found: ${recipeIngredient.name}`);
            }

            return {
              ingredientId,
              quantity: recipeIngredient.quantity,
            };
          }),
        },
      },
    });
  }

  const cakeId = (name: string): number => {
    const cake = cakesByName.get(name);

    if (!cake) {
      throw new Error(`Cake not found for demo order: ${name}`);
    }

    return cake.id;
  };

  await prisma.order.create({
    data: {
      customerName: 'Мария Иванова',
      phone: '0888123456',
      pickupDate: pickupDate(1),
      notes: 'Демо поръчка — очаква потвърждение.',
      status: 'pending',
      items: {
        create: [
          { cakeId: cakeId('Шоколадова наслада'), quantity: 2 },
          { cakeId: cakeId('Ванилова мечта'), quantity: 1 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'Георги Петров',
      phone: '0888234567',
      pickupDate: pickupDate(0),
      notes: 'Демо поръчка — потвърдена за днес.',
      status: 'confirmed',
      items: {
        create: [
          { cakeId: cakeId('Лимонов бриз'), quantity: 1 },
          { cakeId: cakeId('Oreo мечта'), quantity: 1 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'Елена Димитрова',
      phone: '0888345678',
      pickupDate: pickupDate(0),
      notes: 'Демо поръчка — част от тортите са готови.',
      status: 'in_progress',
      items: {
        create: [
          {
            cakeId: cakeId('Червено кадифе'),
            quantity: 2,
            completedQuantity: 1,
          },
          {
            cakeId: cakeId('Ядкова еуфория'),
            quantity: 1,
            completedQuantity: 1,
          },
        ],
      },
    },
  });

  console.log('Seed complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
