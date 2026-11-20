import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicService } from './public.service';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { AppointmentsService } from '../appointments/appointments.service';

describe('PublicService', () => {
  let service: PublicService;

  const employees = { findPublicEmployees: vi.fn() };
  const customers = { findByPhone: vi.fn(), createCustomer: vi.fn() };
  const appointments = {
    createAppointment: vi.fn(),
    findUpcomingByPhone: vi.fn(),
    findByIdAndPhone: vi.fn(),
    cancelAppointment: vi.fn(),
  };

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

  describe('listUpcoming', () => {
    afterEach(() => vi.useRealTimers());

    it('marca cancellable según el cutoff (2h por defecto)', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-08-01T12:00:00Z')); // cutoff => 14:00

      appointments.findUpcomingByPhone.mockResolvedValue([
        {
          id: 'a1',
          startsAt: new Date('2026-08-01T20:00:00Z'),
          endsAt: new Date('2026-08-01T20:30:00Z'),
          status: 'CONFIRMED',
          employee: { name: 'Nito' },
        },
        {
          id: 'a2',
          startsAt: new Date('2026-08-01T13:00:00Z'),
          endsAt: new Date('2026-08-01T13:30:00Z'),
          status: 'CONFIRMED',
          employee: { name: 'Nito' },
        },
      ]);

      const res = await service.listUpcoming(' 123 ');

      expect(appointments.findUpcomingByPhone).toHaveBeenCalledWith('123');
      expect(res.items[0]).toMatchObject({
        id: 'a1',
        employeeName: 'Nito',
        cancellable: true,
      });
      expect(res.items[1]).toMatchObject({ id: 'a2', cancellable: false });
    });
  });

  describe('cancel', () => {
    afterEach(() => vi.useRealTimers());

    it('404 si no existe o el teléfono no coincide', async () => {
      appointments.findByIdAndPhone.mockResolvedValue(null);

      await expect(service.cancel('a1', '123')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('400 si el estado no es cancelable', async () => {
      appointments.findByIdAndPhone.mockResolvedValue({
        status: 'COMPLETED',
        startsAt: new Date('2026-12-01T10:00:00Z'),
      });

      await expect(service.cancel('a1', '123')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('400 si falta menos que el cutoff', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));

      appointments.findByIdAndPhone.mockResolvedValue({
        status: 'CONFIRMED',
        startsAt: new Date('2026-08-01T13:00:00Z'),
      });

      await expect(service.cancel('a1', '123')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('cancela correctamente y normaliza el teléfono', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));

      appointments.findByIdAndPhone.mockResolvedValue({
        status: 'CONFIRMED',
        startsAt: new Date('2026-08-01T20:00:00Z'),
      });
      appointments.cancelAppointment.mockResolvedValue({
        id: 'a1',
        status: 'CANCELLED',
      });

      await expect(service.cancel('a1', ' 123 ')).resolves.toEqual({
        id: 'a1',
        status: 'CANCELLED',
      });
      expect(appointments.findByIdAndPhone).toHaveBeenCalledWith('a1', '123');
      expect(appointments.cancelAppointment).toHaveBeenCalledWith('a1');
    });
  });
});
