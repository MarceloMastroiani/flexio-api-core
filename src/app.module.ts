import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [AuthModule, PrismaModule, CustomersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
