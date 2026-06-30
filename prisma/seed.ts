import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const hashedPassword = await bcrypt.hash('1234', 10);

  await prisma.user.create({
    data: {
      email: 'admin@pelu',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
