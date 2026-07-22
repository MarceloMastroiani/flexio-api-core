import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsRepository } from './reports.repository';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  getRevenue(from: string, to: string) {
    const revenue = this.reportsRepository.getRevenue(from, to);

    if (!revenue) {
      throw new HttpException('No revenue found', HttpStatus.NOT_FOUND);
    }

    return revenue;
  }
}
