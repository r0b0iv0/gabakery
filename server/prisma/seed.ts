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

  console.log('Seed complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
