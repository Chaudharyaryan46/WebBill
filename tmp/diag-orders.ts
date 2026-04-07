import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ids = ['cmnkmez25002qrm5glzenwfaj', 'cmnkmdij4001mrm5gv6xxdd0o'];
  for (const id of ids) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { transaction: true }
    });
    console.log(`Order ${id}:`, JSON.stringify(order, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
