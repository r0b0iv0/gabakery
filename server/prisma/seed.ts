import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.order.deleteMany();
  await prisma.cake.deleteMany();

  await prisma.cake.createMany({
    data: [
      { name: 'Шоколадова наслада', description: 'Блатове с тъмен шоколад и ганаш', price: 45, emoji: '🍫' },
      { name: 'Ванилова мечта', description: 'Ванилов блат с крем и пресни ягоди', price: 40, emoji: '🍓' },
      { name: 'Лимонов бриз', description: 'Лек лимонов блат с меринга', price: 42, emoji: '🍋' },
      { name: 'Червено кадифе', description: 'Класическа Red Velvet с крем сирене', price: 48, emoji: '❤️' },
      { name: 'Ядкова еуфория', description: 'Блат с лешници и карамел', price: 50, emoji: '🌰' },
      { name: 'Oreo мечта', description: 'Шоколадов блат с бисквити Oreo', price: 46, emoji: '🍪' },
    ],
  });

  const ingredients = [
    { name: 'Flour', unit: 'g' },
    { name: 'Sugar', unit: 'g' },
    { name: 'Butter', unit: 'g' },
    { name: 'Eggs', unit: 'pcs' },
    { name: 'Milk', unit: 'ml' },
    { name: 'Chocolate', unit: 'g' },
    { name: 'Cocoa', unit: 'g' },
    { name: 'Cream', unit: 'ml' },
    { name: 'Vanilla', unit: 'ml' },
    { name: 'Baking powder', unit: 'g' },
    { name: 'Salt', unit: 'g' },
    { name: 'Strawberries', unit: 'g' },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient,
    });
  }


  console.log('Seed complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
