import { Injectable, Logger } from '@nestjs/common';
import { EmployeesReportRepository } from '../repositories/employees-report.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';
import { resolveRange } from '../helpers/date-range.helper';
import { buildMeta } from '../helpers/meta.helper';
import { pct } from '../helpers/money.helper';
import {
  availableMinutesInRange,
  reservedMinutes,
  type Availability,
} from '../helpers/occupancy.helper';
import { runReport } from '../helpers/run-report.helper';
import type { ReportRangeDto } from '../dto/report-range.dto';
import type {
  EmployeeReportItemDto,
  EmployeesDataDto,
  EmployeesResponseDto,
} from '../types/report-response.type';

@Injectable()
export class EmployeesReportService {
  private readonly logger = new Logger(EmployeesReportService.name);

  constructor(
    private readonly repo: EmployeesReportRepository,
    private readonly cache: ReportsCacheService,
  ) {}

  async getReport(dto: ReportRangeDto): Promise<EmployeesResponseDto> {
    const range = resolveRange(dto);

    return runReport(
      this.logger,
      this.cache,
      'employees',
      range,
      {},
      async () => {
        const [employees, counts, revenues, occupancyRows] = await Promise.all([
          this.repo.getEmployees(),
          this.repo.getCountsByEmployee(range.fromUtc, range.toUtcExclusive),
          this.repo.getRevenueByEmployee(range.fromUtc, range.toUtcExclusive),
          this.repo.getOccupancyAppointments(
            range.fromUtc,
            range.toUtcExclusive,
          ),
        ]);

        const countsMap = new Map(counts.map((row) => [row.employeeId, row]));
        const revenueMap = new Map(
          revenues.map((row) => [row.employeeId, row.revenue]),
        );

        const reservedByEmployee = new Map<string, number>();
        for (const row of occupancyRows) {
          const reserved = reservedMinutes(
            row.startsAt,
            row.endsAt,
            range.fromUtc,
            range.toUtcExclusive,
          );
          reservedByEmployee.set(
            row.employeeId,
            (reservedByEmployee.get(row.employeeId) ?? 0) + reserved,
          );
        }

        let totalReserved = 0;
        let totalAvailable = 0;

        const items: EmployeeReportItemDto[] = employees.map((employee) => {
          const count = countsMap.get(employee.id);
          const availability = (employee.availability ?? {}) as Availability;
          const available = availableMinutesInRange(
            availability,
            range.from,
            range.to,
            range.tz,
          );
          const reserved = reservedByEmployee.get(employee.id) ?? 0;

          totalReserved += reserved;
          totalAvailable += available;

          return {
            employeeId: employee.id,
            name: employee.name,
            appointments: {
              total: count?.total ?? 0,
              completed: count?.completed ?? 0,
              cancelled: count?.cancelled ?? 0,
            },
            revenue: revenueMap.get(employee.id) ?? 0,
            extendedAppointments: count?.extendedCount ?? 0,
            extendedSlotsTotal: count?.extendedSlotsTotal ?? 0,
            occupancyPct: available > 0 ? pct(reserved, available) : null,
          };
        });

        const data: EmployeesDataDto = {
          employees: items,
          occupancyPct:
            totalAvailable > 0 ? pct(totalReserved, totalAvailable) : null,
        };

        return { meta: buildMeta(range), data };
      },
    );
  }
}
