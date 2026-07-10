import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CashModule } from './cash/cash.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, PrismaModule, CustomersModule, NotificationsModule, CashModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
