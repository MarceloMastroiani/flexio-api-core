import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicService } from './public.service';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { AppointmentsService } from '../appointments/appointments.service';

describe('PublicService', () => {
  let service: PublicService;

  const employees = { findPublicEmployees: vi.fn() };
  const customers = { findByPhone: vi.fn(), createCustomer: vi.fn() };
  const appointments = { createAppointment: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: EmployeesService, useValue: employees },
        { provide: CustomersService, useValue: customers },
        { provide: AppointmentsService, useValue: appointments },
      ],
    }).compile();

    service = moduleRef.get(PublicService);
  });

  describe('createBooking', () => {
    const dto = {
      name: 'X',
      phone: '123',
      employeeId: 'e1',
      startsAt: '2026-12-02T10:00:00.000Z',
    };

    it('crea el cliente si no existe y reserva el turno', async () => {
      customers.findByPhone.mockResolvedValue(null);
      customers.createCustomer.mockResolvedValue({
        id: 'c1',
        name: 'X',
        phone: '123',
      });
      appointments.createAppointment.mockResolvedValue({ id: 'a1' });

      await service.createBooking(dto);

      expect(customers.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'X', phone: '123' }),
      );
      expect(appointments.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'c1', employeeId: 'e1' }),
      );
    });

    it('reutiliza el cliente existente (no lo vuelve a crear)', async () => {
      customers.findByPhone.mockResolvedValue({
        id: 'c1',
        name: 'X',
        phone: '123',
      });
      appointments.createAppointment.mockResolvedValue({ id: 'a1' });

      await service.createBooking(dto);

      expect(customers.createCustomer).not.toHaveBeenCalled();
      expect(appointments.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'c1' }),
      );
    });
  });

  describe('listEmployees', () => {
    it('devuelve la lista reducida de empleados', async () => {
      employees.findPublicEmployees.mockResolvedValue([
        { id: 'e1', name: 'Nito' },
      ]);

      await expect(service.listEmployees()).resolves.toEqual([
        { id: 'e1', name: 'Nito' },
      ]);
    });
  });
});
