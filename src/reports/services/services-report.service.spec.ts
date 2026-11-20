import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicesReportService } from './services-report.service';
import { ServicesReportRepository } from '../repositories/services-report.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';

describe('ServicesReportService', () => {
  let service: ServicesReportService;

  const repo = {
    getCoverage: vi.fn(),
    getTopServices: vi.fn(),
  };
  const cache = {
    buildKey: vi.fn(() => 'key'),
    getOrCompute: vi.fn(
      (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesReportService,
        { provide: ServicesReportRepository, useValue: repo },
        { provide: ReportsCacheService, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(ServicesReportService);
  });

  it('calcula coveragePct y sharePct (~100 con un solo servicio)', async () => {
    repo.getCoverage.mockResolvedValue({ completed: 10, withServices: 10 });
    repo.getTopServices.mockResolvedValue([
      { serviceId: 's1', name: 'Corte', count: 10, revenue: 1000 },
    ]);

    const res = await service.getTop({
      from: '2026-01-01',
      to: '2026-01-31',
      limit: 10,
      orderBy: 'count',
    });

    expect(res.data.completedAppointments).toBe(10);
    expect(res.data.appointmentsWithoutServices).toBe(0);
    expect(res.data.coveragePct).toBe(100);
    expect(res.data.services[0]?.sharePct).toBe(100);
  });

  it('calcula coveragePct con turnos sin servicio', async () => {
    repo.getCoverage.mockResolvedValue({ completed: 10, withServices: 8 });
    repo.getTopServices.mockResolvedValue([
      { serviceId: 's1', name: 'Corte', count: 8, revenue: 800 },
    ]);

    const res = await service.getTop({
      from: '2026-01-01',
      to: '2026-01-31',
      limit: 10,
      orderBy: 'count',
    });

    expect(res.data.coveragePct).toBe(80);
    expect(res.data.appointmentsWithoutServices).toBe(2);
  });
});
