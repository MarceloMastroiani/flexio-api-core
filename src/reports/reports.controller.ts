import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorador';
import { TimeSeriesQueryDto } from './dto/time-series-query.dto';
import { ReportRangeDto } from './dto/report-range.dto';
import { TopQueryDto } from './dto/top-query.dto';
import { InactiveCustomersQueryDto } from './dto/inactive-customers-query.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { RevenueService } from './services/revenue.service';
import { AppointmentsReportService } from './services/appointments-report.service';
import { ServicesReportService } from './services/services-report.service';
import { EmployeesReportService } from './services/employees-report.service';
import { CustomersReportService } from './services/customers-report.service';
import { SummaryService } from './services/summary.service';
import { toCsv, type CsvColumn } from './helpers/csv.helper';
import {
  AppointmentsResponseDto,
  AppointmentsSeriesPointDto,
  CustomersResponseDto,
  EmployeesResponseDto,
  HeatmapResponseDto,
  InactiveCustomersResponseDto,
  RevenueResponseDto,
  RevenueSeriesPointDto,
  ServicesResponseDto,
  SummaryResponseDto,
} from './types/report-response.type';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly appointmentsService: AppointmentsReportService,
    private readonly servicesService: ServicesReportService,
    private readonly employeesService: EmployeesReportService,
    private readonly customersService: CustomersReportService,
    private readonly summaryService: SummaryService,
  ) {}

  @Get('revenue')
  @ApiOkResponse({ type: RevenueResponseDto })
  async getRevenue(
    @Query() query: TimeSeriesQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.revenueService.getRevenue(query);

    if (query.format === 'csv') {
      const columns: CsvColumn<RevenueSeriesPointDto>[] = [
        { key: 'date', label: 'date' },
        { key: 'total', label: 'total' },
        { key: 'count', label: 'count' },
      ];
      return this.csv(
        res,
        toCsv(columns, report.data.series),
        `revenue_${report.meta.from}_${report.meta.to}.csv`,
      );
    }

    return report;
  }

  @Get('appointments/heatmap')
  @ApiOkResponse({ type: HeatmapResponseDto })
  getHeatmap(@Query() query: ReportRangeDto) {
    return this.appointmentsService.getHeatmap(query);
  }

  @Get('appointments')
  @ApiOkResponse({ type: AppointmentsResponseDto })
  async getAppointments(
    @Query() query: TimeSeriesQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.appointmentsService.getReport(query);

    if (query.format === 'csv') {
      const columns: CsvColumn<AppointmentsSeriesPointDto>[] = [
        { key: 'date', label: 'date' },
        { key: 'total', label: 'total' },
        { key: 'completed', label: 'completed' },
        { key: 'cancelled', label: 'cancelled' },
      ];
      return this.csv(
        res,
        toCsv(columns, report.data.series),
        `appointments_${report.meta.from}_${report.meta.to}.csv`,
      );
    }

    return report;
  }

  @Get('services/top')
  @ApiOkResponse({ type: ServicesResponseDto })
  getTopServices(@Query() query: TopQueryDto) {
    return this.servicesService.getTop(query);
  }

  @Get('employees')
  @ApiOkResponse({ type: EmployeesResponseDto })
  getEmployees(@Query() query: ReportRangeDto) {
    return this.employeesService.getReport(query);
  }

  @Get('customers/inactive')
  @ApiOkResponse({ type: InactiveCustomersResponseDto })
  getInactiveCustomers(@Query() query: InactiveCustomersQueryDto) {
    return this.customersService.getInactive(query);
  }

  @Get('customers')
  @ApiOkResponse({ type: CustomersResponseDto })
  getCustomers(@Query() query: TopQueryDto) {
    return this.customersService.getReport(query);
  }

  @Get('summary')
  @ApiOkResponse({ type: SummaryResponseDto })
  getSummary(@Query() query: SummaryQueryDto) {
    return this.summaryService.getSummary(query);
  }

  private csv(res: Response, body: string, filename: string): string {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return body;
  }
}
