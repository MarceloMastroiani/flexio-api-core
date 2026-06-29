import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import { envs } from '../configs/envs';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: envs.databaseUrl,
    });
    super({ adapter });
  }

  onModuleInit() {
    this.$connect();
    Logger.log('Database connected');
  }
  onModuleDestroy() {
    this.$disconnect();
    Logger.log('Database disconnected');
  }
}

// Este servicio se encarga de la conexión con la base de datos utilizando Prisma y la adaptación a PostgreSQL.
// Es inyectable en otros servicios y controladores para interactuar con la base de datos.
