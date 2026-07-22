import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

// 1. TODO: Crear el modulo de Appointments antes de seguir con reports
// 2. TODO: Crear endpoints para reportes.
// GET /reports/revenue?from=&to=     -> ingresos por período
// GET /reports/appointments?month=   -> turnos del mes
// GET /reports/services/top          -> servicios más pedidos
// GET /reports/summary               -> dashboard general


@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  //ingresos por período
  @Get('revenue')
  getRevenue(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getRevenue(from, to);
  }

}
