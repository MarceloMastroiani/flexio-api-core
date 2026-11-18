import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { EmployeesModule } from '../employees/employees.module';
import { CustomersModule } from '../customers/customers.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [EmployeesModule, CustomersModule, AppointmentsModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
