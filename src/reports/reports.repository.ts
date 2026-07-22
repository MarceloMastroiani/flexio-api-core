import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";


@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(from: string, to: string) {
    return ``
  }
}
