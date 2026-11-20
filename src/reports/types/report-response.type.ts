import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Tipos internos ───────────────────────────────────────────────────────────

export interface Delta {
  value: number;
  previous: number;
  changePct: number | null;
}

export interface TimeSeriesPoint {
  date: string;
  [key: string]: string | number;
}

export interface ReportMeta {
  from: string;
  to: string;
  timezone: string;
  granularity?: string;
  generatedAt: string;
  comparison?: { from: string; to: string };
}

export interface ReportResponse<T> {
  meta: ReportMeta;
  data: T;
}

// ── Swagger: comunes ─────────────────────────────────────────────────────────

export class DeltaDto {
  @ApiProperty({ example: 12345.67 })
  value!: number;

  @ApiProperty({ example: 11000 })
  previous!: number;

  @ApiProperty({ example: 12.2, nullable: true })
  changePct!: number | null;
}

export class ReportMetaDto {
  @ApiProperty({ example: '2026-08-01' })
  from!: string;

  @ApiProperty({ example: '2026-08-31' })
  to!: string;

  @ApiProperty({ example: 'America/Argentina/Buenos_Aires' })
  timezone!: string;

  @ApiPropertyOptional({ example: 'day' })
  granularity?: string;

  @ApiProperty({ example: '2026-08-31T20:00:00.000Z' })
  generatedAt!: string;

  @ApiPropertyOptional({ example: { from: '2026-07-01', to: '2026-07-31' } })
  comparison?: { from: string; to: string };
}

export class RevenueSeriesPointDto {
  @ApiProperty({ example: '2026-08-01' })
  date!: string;

  @ApiProperty({ example: 12345.67 })
  total!: number;

  @ApiProperty({ example: 8 })
  count!: number;
}

export class RevenueByMethodDto {
  @ApiProperty({ example: 'CASH' })
  method!: string;

  @ApiProperty({ example: 8000 })
  total!: number;

  @ApiProperty({ example: 5 })
  count!: number;

  @ApiProperty({ example: 64.8, nullable: true })
  sharePct!: number | null;
}

export class RevenueDataDto {
  @ApiProperty({ example: 12345.67 })
  total!: number;

  @ApiProperty({ example: 40 })
  paymentsCount!: number;

  @ApiProperty({ example: 308.64 })
  averageTicket!: number;

  @ApiProperty({ type: [RevenueSeriesPointDto] })
  series!: RevenueSeriesPointDto[];

  @ApiProperty({ type: [RevenueByMethodDto] })
  byMethod!: RevenueByMethodDto[];
}

export class RevenueResponseDto {
  @ApiProperty({ type: ReportMetaDto })
  meta!: ReportMetaDto;

  @ApiProperty({ type: RevenueDataDto })
  data!: RevenueDataDto;
}

// ── Appointments ─────────────────────────────────────────────────────────────

export class AppointmentsByStatusDto {
  @ApiProperty({ example: 3 }) PENDING!: number;
  @ApiProperty({ example: 10 }) CONFIRMED!: number;
  @ApiProperty({ example: 22 }) COMPLETED!: number;
  @ApiProperty({ example: 5 }) CANCELLED!: number;
}

export class AppointmentsSeriesPointDto {
  @ApiProperty({ example: '2026-08-01' }) date!: string;
  @ApiProperty({ example: 6 }) total!: number;
  @ApiProperty({ example: 4 }) completed!: number;
  @ApiProperty({ example: 1 }) cancelled!: number;
}

export class AppointmentsDataDto {
  @ApiProperty({ example: 40 }) total!: number;
  @ApiProperty({ type: AppointmentsByStatusDto })
  byStatus!: AppointmentsByStatusDto;
  @ApiProperty({ example: 55, nullable: true }) completionRatePct!:
    | number
    | null;
  @ApiProperty({ example: 12.5, nullable: true }) cancellationRatePct!:
    | number
    | null;
  @ApiProperty({ example: 7 }) extendedCount!: number;
  @ApiProperty({ type: [AppointmentsSeriesPointDto] })
  series!: AppointmentsSeriesPointDto[];
}

export class AppointmentsResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: AppointmentsDataDto }) data!: AppointmentsDataDto;
}

export class HeatmapBusiestSlotDto {
  @ApiProperty({ example: 3 }) weekday!: number;
  @ApiProperty({ example: 15 }) hour!: number;
  @ApiProperty({ example: 12 }) count!: number;
}

export class HeatmapDataDto {
  @ApiProperty({
    description:
      'Matriz 7x24 (1=lunes … 7=domingo) con conteo de turnos no cancelados',
    example: 'number[7][24]',
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
  })
  matrix!: number[][];

  @ApiProperty({ type: HeatmapBusiestSlotDto, nullable: true })
  busiestSlot!: HeatmapBusiestSlotDto | null;
}

export class HeatmapResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: HeatmapDataDto }) data!: HeatmapDataDto;
}

// ── Services ─────────────────────────────────────────────────────────────────

export class TopServiceItemDto {
  @ApiProperty({ example: 'uuid' }) serviceId!: string;
  @ApiProperty({ example: 'Corte de pelo' }) name!: string;
  @ApiProperty({ example: 25 }) count!: number;
  @ApiProperty({ example: 162500 }) revenue!: number;
  @ApiProperty({ example: 40.5, nullable: true }) sharePct!: number | null;
}

export class ServicesDataDto {
  @ApiProperty({ example: 60 }) completedAppointments!: number;
  @ApiProperty({ example: 48 }) appointmentsWithServices!: number;
  @ApiProperty({ example: 12 }) appointmentsWithoutServices!: number;
  @ApiProperty({ example: 80, nullable: true }) coveragePct!: number | null;
  @ApiProperty({ type: [TopServiceItemDto] }) services!: TopServiceItemDto[];
}

export class ServicesResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: ServicesDataDto }) data!: ServicesDataDto;
}

// ── Employees ────────────────────────────────────────────────────────────────

export class EmployeeAppointmentCountsDto {
  @ApiProperty({ example: 30 }) total!: number;
  @ApiProperty({ example: 20 }) completed!: number;
  @ApiProperty({ example: 4 }) cancelled!: number;
}

export class EmployeeReportItemDto {
  @ApiProperty({ example: 'uuid' }) employeeId!: string;
  @ApiProperty({ example: 'Nito' }) name!: string;
  @ApiProperty({ type: EmployeeAppointmentCountsDto })
  appointments!: EmployeeAppointmentCountsDto;
  @ApiProperty({ example: 150000 }) revenue!: number;
  @ApiProperty({ example: 6 }) extendedAppointments!: number;
  @ApiProperty({ example: 9 }) extendedSlotsTotal!: number;
  @ApiProperty({ example: 72.4, nullable: true }) occupancyPct!: number | null;
}

export class EmployeesDataDto {
  @ApiProperty({ type: [EmployeeReportItemDto] })
  employees!: EmployeeReportItemDto[];
  @ApiProperty({ example: 68.1, nullable: true }) occupancyPct!: number | null;
}

export class EmployeesResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: EmployeesDataDto }) data!: EmployeesDataDto;
}

// ── Customers ────────────────────────────────────────────────────────────────

export class CustomerSpendDto {
  @ApiProperty({ example: 'uuid' }) customerId!: string;
  @ApiProperty({ example: 'Leo Messi' }) name!: string;
  @ApiProperty({ example: 6 }) visits!: number;
  @ApiProperty({ example: 90000 }) totalSpent!: number;
}

export class CustomersDataDto {
  @ApiProperty({ example: 120 }) activeCustomers!: number;
  @ApiProperty({ example: 18 }) newCustomers!: number;
  @ApiProperty({ example: 45 }) returningCustomers!: number;
  @ApiProperty({ type: [CustomerSpendDto] }) topBySpend!: CustomerSpendDto[];
  @ApiProperty({ type: [CustomerSpendDto] }) topByVisits!: CustomerSpendDto[];
}

export class CustomersResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: CustomersDataDto }) data!: CustomersDataDto;
}

export class InactiveCustomerItemDto {
  @ApiProperty({ example: 'uuid' }) customerId!: string;
  @ApiProperty({ example: 'Leo Messi' }) name!: string;
  @ApiProperty({ example: '+54911...', nullable: true }) phone!: string | null;
  @ApiProperty({ example: 'leo@mail.com', nullable: true }) email!:
    | string
    | null;
  @ApiProperty({ example: '2026-01-10T14:00:00.000Z', nullable: true })
  lastVisitAt!: string | null;
}

export class InactiveCustomersDataDto {
  @ApiProperty({ type: [InactiveCustomerItemDto] })
  items!: InactiveCustomerItemDto[];
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) pageSize!: number;
  @ApiProperty({ example: 57 }) total!: number;
}

export class InactiveCustomersResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: InactiveCustomersDataDto })
  data!: InactiveCustomersDataDto;
}

// ── Summary ──────────────────────────────────────────────────────────────────

export class SummaryTopServiceDto {
  @ApiProperty({ example: 'Corte de pelo' }) name!: string;
  @ApiProperty({ example: 25 }) count!: number;
}

export class SummaryDataDto {
  @ApiProperty({ type: DeltaDto }) revenue!: DeltaDto;
  @ApiProperty({ type: DeltaDto }) paymentsCount!: DeltaDto;
  @ApiProperty({ type: DeltaDto }) averageTicket!: DeltaDto;
  @ApiProperty({ type: DeltaDto }) appointmentsTotal!: DeltaDto;
  @ApiProperty({ type: DeltaDto }) completionRatePct!: DeltaDto;
  @ApiProperty({ type: DeltaDto }) cancellationRatePct!: DeltaDto;
  @ApiProperty({ type: DeltaDto, nullable: true })
  newCustomers!: DeltaDto | null;
  @ApiProperty({ type: SummaryTopServiceDto, nullable: true })
  topService!: SummaryTopServiceDto | null;
  @ApiProperty({ type: DeltaDto, nullable: true })
  occupancyPct!: DeltaDto | null;
}

export class SummaryResponseDto {
  @ApiProperty({ type: ReportMetaDto }) meta!: ReportMetaDto;
  @ApiProperty({ type: SummaryDataDto }) data!: SummaryDataDto;
}
