import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: implementar el cálculo real. Stub que devuelve vacío por ahora.
  getRevenue(_from: string, _to: string): string {
    return '';
  }
}
