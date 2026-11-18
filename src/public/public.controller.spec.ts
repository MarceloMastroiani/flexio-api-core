import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

describe('PublicController', () => {
  let controller: PublicController;

  const publicService = {
    listEmployees: vi.fn(),
    createBooking: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [{ provide: PublicService, useValue: publicService }],
    }).compile();

    controller = moduleRef.get(PublicController);
  });

  it('lista empleados', async () => {
    publicService.listEmployees.mockResolvedValue([{ id: 'e1', name: 'Nito' }]);

    await expect(controller.listEmployees()).resolves.toEqual([
      { id: 'e1', name: 'Nito' },
    ]);
    expect(publicService.listEmployees).toHaveBeenCalledTimes(1);
  });

  it('crea una reserva pública', async () => {
    const dto: CreatePublicAppointmentDto = {
      name: 'X',
      phone: '123',
      employeeId: 'e1',
      startsAt: '2026-12-02T10:00:00.000Z',
    };
    publicService.createBooking.mockResolvedValue({ id: 'a1' });

    await expect(controller.createBooking(dto)).resolves.toEqual({ id: 'a1' });
    expect(publicService.createBooking).toHaveBeenCalledWith(dto);
  });
});
