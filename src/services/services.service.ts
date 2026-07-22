import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesRepository } from './services.repository';


@Injectable()
export class ServicesService {

  constructor(private readonly serviceRepository: ServicesRepository) {}

  // Create a service
  async createService(createServiceDto: CreateServiceDto) {
    const newService = await this.serviceRepository.createService(createServiceDto);

    if(!newService) {
      throw new HttpException('Failed to create service', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return newService;
  }


  // Find all services
  async findAllServices() {
    const services = await this.serviceRepository.findAllServices();

    if(!services) {
      throw new HttpException('No services found', HttpStatus.NOT_FOUND);
    }

    return services
  }

  // Update a service
  async updateService(id: string, updateServiceDto: UpdateServiceDto) {
    const updatedService = await this.serviceRepository.updateService(id, updateServiceDto);

    if(!updatedService) {
      throw new HttpException('Failed to update service', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return updatedService;
  }

  async deleteService(id: string) {
    const deletedService = await this.serviceRepository.deleteService(id);

    if(!deletedService) {
      throw new HttpException('Failed to delete service', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return deletedService;
  }
}
