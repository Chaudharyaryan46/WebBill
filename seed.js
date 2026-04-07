const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('--- SEEDING ESSENTIAL DATA (JS) ---');

    const hotelId = 'SFB-99';
    await prisma.hotel.upsert({
      where: { id: hotelId },
      update: {},
      create: {
        id: hotelId,
        name: 'Saffron Bay',
        slug: 'saffron-bay',
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });

    for (let i = 1; i <= 25; i++) {
      const id = `T${i}`;
      await prisma.table.upsert({
        where: { id },
        update: {},
        create: { id, number: id, capacity: 4, hotelId }
      });
    }

    const catId = 'cat-starters';
    await prisma.menuCategory.upsert({
      where: { id: catId },
      update: {},
      create: { id: catId, name: 'Starters', hotelId }
    });

    const items = [
      { id: 't1', name: 'Gourmet Tomato Basil', price: 12 },
      { id: 't2', name: 'Truffle Mushroom Soup', price: 15 },
      { id: 't3', name: 'Paneer Tikka Platter', price: 18 },
      { id: 't4', name: 'Crispy Avocado Toast', price: 14 },
    ];

    for (const item of items) {
      await prisma.menuItem.upsert({
        where: { id: item.id },
        update: {},
        create: { ...item, categoryId: catId, hotelId, isAvailable: true }
      });
    }

    console.log('--- SEEDING COMPLETE ---');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
