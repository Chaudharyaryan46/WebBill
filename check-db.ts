import { prisma } from './src/lib/db';

async function checkDb() {
  try {
    const hotels = await prisma.hotel.findMany();
    const tables = await prisma.table.findMany();
    console.log('Hotels:', hotels);
    console.log('Tables:', tables);
  } catch (err) {
    console.error('DB Check Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
