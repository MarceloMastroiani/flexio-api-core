import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CashModule } from './cash/cash.module';
import { ReportsModule } from './reports/reports.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ServicesModule } from './services/services.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    CustomersModule,
    NotificationsModule,
    CashModule,
    ReportsModule,
    AppointmentsModule,
    ServicesModule,
    EmployeesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
