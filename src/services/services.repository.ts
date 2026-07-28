import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createService(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAllServices() {
    return this.prisma.service.findMany();
  }

  async findOneService(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async findServicesByIds(ids: string[]) {
    const services = await this.prisma.service.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return services;
  }

  async deleteService(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

}
