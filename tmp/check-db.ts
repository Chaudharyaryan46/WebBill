import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent Transactions:', JSON.stringify(transactions, null, 2));

  const orders = await prisma.order.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  console.log('Recent Completed Orders:', JSON.stringify(orders, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
