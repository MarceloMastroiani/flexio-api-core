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

// Este codigo se ejecuta al iniciar la aplicacion y crea un usuario administrador si no existe, se ejecuta manualmente con
// "docker compose exec api pnpm exec prisma db seed"
// Se puede ejecutar con "pnpm exec prisma db seed" sin necesidad de Docker
// "exec" es una herramienta de Docker que permite ejecutar comandos en un contenedor
