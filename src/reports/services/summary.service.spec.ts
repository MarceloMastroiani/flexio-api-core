import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SummaryService } from './summary.service';
import { RevenueService } from './revenue.service';
import { AppointmentsReportService } from './appointments-report.service';
import { CustomersReportService } from './customers-report.service';
import { ServicesReportService } from './services-report.service';
import { EmployeesReportService } from './employees-report.service';
import { ReportsCacheService } from '../cache/reports-cache.service';

describe('SummaryService', () => {
  let service: SummaryService;

  const revenue = { getRevenue: vi.fn() };
  const appointments = { getReport: vi.fn() };
  const customers = { getReport: vi.fn() };
  const services = { getTop: vi.fn() };
  const employees = { getReport: vi.fn() };
  const cache = {
    buildKey: vi.fn(() => 'key'),
    getOrCompute: vi.fn(
      (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SummaryService,
        { provide: RevenueService, useValue: revenue },
        { provide: AppointmentsReportService, useValue: appointments },
        { provide: CustomersReportService, useValue: customers },
        { provide: ServicesReportService, useValue: services },
        { provide: EmployeesReportService, useValue: employees },
        { provide: ReportsCacheService, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(SummaryService);
  });

  function baseMocks() {
    revenue.getRevenue.mockImplementation((q: { from?: string }) =>
      Promise.resolve({
        data: {
          total: q.from === '2026-01-01' ? 1000 : 800,
          paymentsCount: 10,
          averageTicket: 100,
        },
      }),
    );
    appointments.getReport.mockResolvedValue({
      data: { total: 5, completionRatePct: 80, cancellationRatePct: 10 },
    });
    customers.getReport.mockImplementation((q: { from?: string }) =>
      Promise.resolve({
        data: { newCustomers: q.from === '2026-01-01' ? 3 : 2 },
      }),
    );
    services.getTop.mockResolvedValue({
      data: { services: [{ name: 'Corte', count: 4 }] },
    });
    employees.getReport.mockResolvedValue({ data: { occupancyPct: 50 } });
  }

  it('con compare=true devuelve deltas y meta.comparison', async () => {
    baseMocks();

    const res = await service.getSummary({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(res.meta.comparison).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
    expect(res.data.revenue).toEqual({
      value: 1000,
      previous: 800,
      changePct: 25,
    });
    expect(res.data.newCustomers).toEqual({
      value: 3,
      previous: 2,
      changePct: 50,
    });
  });

  it('con compare=false devuelve números planos', async () => {
    baseMocks();

    const res = await service.getSummary({
      from: '2026-01-01',
      to: '2026-01-31',
      compare: false,
    });

    expect(res.meta.comparison).toBeUndefined();
    expect(res.data.revenue).toBe(1000);
  });

  it('tolera fallas de campos opcionales (topService null)', async () => {
    baseMocks();
    services.getTop.mockRejectedValue(new Error('boom'));

    const res = await service.getSummary({
      from: '2026-01-01',
      to: '2026-01-31',
      compare: false,
    });

    expect(res.data.topService).toBeNull();
    expect(res.data.revenue).toBe(1000);
  });

  it('propaga fallas de campos obligatorios (revenue)', async () => {
    baseMocks();
    revenue.getRevenue.mockRejectedValue(new Error('required failure'));

    await expect(
      service.getSummary({ from: '2026-01-01', to: '2026-01-31' }),
    ).rejects.toThrow('required failure');
  });
});
