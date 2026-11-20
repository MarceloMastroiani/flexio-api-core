import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ReportsController } from './reports.controller';
import { ReportsCacheService } from './cache/reports-cache.service';
import { RevenueRepository } from './repositories/revenue.repository';
import { AppointmentsReportRepository } from './repositories/appointments.repository';
import { ServicesReportRepository } from './repositories/services-report.repository';
import { EmployeesReportRepository } from './repositories/employees-report.repository';
import { CustomersReportRepository } from './repositories/customers-report.repository';
import { RevenueService } from './services/revenue.service';
import { AppointmentsReportService } from './services/appointments-report.service';
import { ServicesReportService } from './services/services-report.service';
import { EmployeesReportService } from './services/employees-report.service';
import { CustomersReportService } from './services/customers-report.service';
import { SummaryService } from './services/summary.service';

@Module({
  imports: [CacheModule.register({ ttl: 300_000, isGlobal: false })],
  controllers: [ReportsController],
  providers: [
    ReportsCacheService,
    RevenueRepository,
    AppointmentsReportRepository,
    ServicesReportRepository,
    EmployeesReportRepository,
    CustomersReportRepository,
    RevenueService,
    AppointmentsReportService,
    ServicesReportService,
    EmployeesReportService,
    CustomersReportService,
    SummaryService,
  ],
})
export class ReportsModule {}
