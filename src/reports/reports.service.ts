import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  // TODO: implementar el reporte de ingresos.
  getRevenue(from: string, to: string): string {
    return this.reportsRepository.getRevenue(from, to);
  }
}
