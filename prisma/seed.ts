import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { hashPassword } from '../src/common/helpers/hash-password.helpers.js';

async function main() {
  const hashedPassword = await hashPassword('1234');

  const prisma = new PrismaService();

  await prisma.user.create({
    data: {
      email: 'admin@pelu',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
}

main();
