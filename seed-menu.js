const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('--- SEEDING NEW MENU ITEMS (JS) ---');

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

    const menuData = [
      {
        category: 'TEA',
        items: [
          { name: 'Regular Tea', price: 50 },
          { name: 'Ginger Tea', price: 60 },
          { name: 'Ginger Fudina Tea', price: 70 },
        ]
      },
      {
        category: 'ICETEA',
        items: [
          { name: 'Lemon Ice Tea', price: 150 },
          { name: 'Peach Ice Tea', price: 160 },
          { name: 'Strawberry Ice Tea', price: 170 },
          { name: 'Green Apple Ice Tea', price: 180 },
        ]
      },
      {
        category: 'HOT COFFEE',
        items: [
          { name: 'Cappuccino', price: 180 },
          { name: 'Café Latte', price: 190 },
          { name: 'Café Mocha', price: 200 },
          { name: 'Irish Hot Coffee', price: 210 },
          { name: 'Tiramisu Coffee', price: 220 },
          { name: 'Flate White Hot Coffee', price: 230 },
          { name: 'French Vanilla Coffee', price: 240 },
        ]
      },
      {
        category: 'CLASSIC SANDWICHES',
        items: [
          { name: 'Bread Butter', price: 80 },
          { name: 'Sing Sev Slice', price: 90 },
          { name: 'Mix Fruit Jam slice', price: 100 },
          { name: 'Pineapple Jam Slice', price: 110 },
          { name: 'Chocolate Sandwich', price: 120 },
          { name: 'Cheese Butter Sandwich', price: 130 },
        ]
      },
      {
        category: 'SANDWICH',
        items: [
          { name: 'Mumbai Style Veg. Sandwich', price: 150 },
          { name: 'Aloo Mutter Sandwich', price: 140 },
          { name: 'Ghughra Sandwich', price: 130 },
          { name: 'Aarika Special Sandwich', price: 180 },
          { name: 'American Club Sandwich', price: 200 },
          { name: 'Paneer Tikka Sandwich', price: 190 },
          { name: 'Tangy Indian Sandwich', price: 170 },
          { name: 'Jungli Sandwich', price: 160 },
        ]
      },
      {
        category: 'GARLIC BREAD',
        items: [
          { name: 'Cheese Garlic Bread', price: 180 },
          { name: 'American Corn Garlic Bread', price: 200 },
          { name: 'Peri-peri Panner Garlic Bread', price: 220 },
          { name: 'Paneer Tukda Garlic Bread', price: 210 },
          { name: 'Double Cheese Garlic Bread', price: 230 },
        ]
      },
      {
        category: 'PASTA',
        items: [
          { name: 'Red Sauce Pasta', price: 250 },
          { name: 'White Sauce Pasta', price: 270 },
          { name: 'Mac & Cheese Pasta', price: 280 },
          { name: 'Pink Pasta', price: 260 },
          { name: 'Pesto Basil Pasta', price: 300 },
        ]
      },
      {
        category: 'FRENCH FRIES',
        items: [
          { name: 'Salted French Fries', price: 120 },
          { name: 'Chaat Masala French Fries', price: 130 },
          { name: 'Peri-peri French Fries', price: 140 },
          { name: 'Black-paper French Fries', price: 150 },
          { name: 'Cheesy Fries', price: 180 },
        ]
      },
      {
        category: 'NAAN PIZZA',
        items: [
          { name: 'Regular Naan Pizza', price: 220 },
          { name: 'Veg Loded Naan Pizza', price: 250 },
          { name: 'Paneer Naan Pizza', price: 270 },
          { name: 'Chilli Garlic Naan Pizza', price: 260 },
        ]
      }
    ];

    for (const cat of menuData) {
      const category = await prisma.menuCategory.upsert({
        where: { id: `cat-${cat.category.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `cat-${cat.category.toLowerCase().replace(/\s+/g, '-')}`,
          name: cat.category,
          hotelId: hotelId
        }
      });

      for (const item of cat.items) {
        await prisma.menuItem.upsert({
          where: { id: `item-${item.name.toLowerCase().replace(/\s+/g, '-')}` },
          update: {
            price: item.price,
            categoryId: category.id,
          },
          create: {
            id: `item-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: item.name,
            price: item.price,
            categoryId: category.id,
            hotelId: hotelId,
            isAvailable: true
          }
        });
      }
    }

    console.log('--- SEEDING COMPLETE ---');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
