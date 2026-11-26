import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { envs } from '../common/configs/envs';

// Mock del helper de disponibilidad para hacer el test determinista
vi.mock('./helpers/availability.helper', () => ({
  calculateAvailableSlots: vi.fn(),
}));

import { calculateAvailableSlots } from './helpers/availability.helper';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const repo = {
    getEmployeeWithAvailability: vi.fn(),
    getBusyAppointments: vi.fn(),
    checkAvailability: vi.fn(),
    createAppointment: vi.fn(),
    findAllAppointments: vi.fn(),
    findById: vi.fn(),
    findToday: vi.fn(),
    findPaged: vi.fn(),
    updateAppointment: vi.fn(),
    updateAppointmentWithLastVisit: vi.fn(),
    removeAppointment: vi.fn(),
  };
  const employees = {
    findOneEmployee: vi.fn(),
    findEmployeeByUserId: vi.fn(),
  };
  const customers = { findOneCustomer: vi.fn() };
  const services = { findOneService: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentsRepository, useValue: repo },
        { provide: EmployeesService, useValue: employees },
        { provide: CustomersService, useValue: customers },
        { provide: ServicesService, useValue: services },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
  });

  describe('createAppointment', () => {
    const startsAt = '2026-12-02T10:00:00.000Z';

    it('usa slotMinutes del empleado como duración por defecto', async () => {
      employees.findOneEmployee.mockResolvedValue({
        id: 'e1',
        slotMinutes: 30,
      });
      customers.findOneCustomer.mockResolvedValue({ id: 'c1', name: 'X' });
      repo.checkAvailability.mockResolvedValue(true);
      repo.createAppointment.mockResolvedValue({ id: 'a1' });

      await service.createAppointment({
        customerId: 'c1',
        employeeId: 'e1',
        startsAt,
      });

      expect(repo.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          startsAt: new Date(startsAt),
          endsAt: new Date('2026-12-02T10:30:00.000Z'),
        }),
      );
    });

    it('usa durationMinutes si se envía', async () => {
      employees.findOneEmployee.mockResolvedValue({
        id: 'e1',
        slotMinutes: 30,
      });
      customers.findOneCustomer.mockResolvedValue({ id: 'c1', name: 'X' });
      repo.checkAvailability.mockResolvedValue(true);
      repo.createAppointment.mockResolvedValue({ id: 'a1' });

      await service.createAppointment({
        customerId: 'c1',
        employeeId: 'e1',
        startsAt,
        durationMinutes: 60,
      });

      expect(repo.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          endsAt: new Date('2026-12-02T11:00:00.000Z'),
        }),
      );
    });

    it('lanza 409 si el horario está ocupado', async () => {
      employees.findOneEmployee.mockResolvedValue({
        id: 'e1',
        slotMinutes: 30,
      });
      customers.findOneCustomer.mockResolvedValue({ id: 'c1', name: 'X' });
      repo.checkAvailability.mockResolvedValue(false);

      await expect(
        service.createAppointment({
          customerId: 'c1',
          employeeId: 'e1',
          startsAt,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza 404 si el empleado no existe', async () => {
      employees.findOneEmployee.mockResolvedValue(null);

      await expect(
        service.createAppointment({
          customerId: 'c1',
          employeeId: 'x',
          startsAt,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateAppointment', () => {
    const existing = {
      id: 'a1',
      startsAt: new Date('2026-12-02T10:00:00.000Z'),
      endsAt: new Date('2026-12-02T10:30:00.000Z'),
      status: 'PENDING',
      serviceId: null,
      customerId: 'c1',
      employeeId: 'e1',
      employee: { slotMinutes: 30 },
    };

    it('asigna un servicio mediante la relación', async () => {
      repo.findById.mockResolvedValue(existing);
      services.findOneService.mockResolvedValue({
        id: 's1',
        name: 'Corte',
        price: 6500,
      });
      repo.updateAppointment.mockResolvedValue({ ...existing });

      await service.updateAppointment('a1', { serviceId: 's1' });

      expect(services.findOneService).toHaveBeenCalledWith('s1');
      expect(repo.updateAppointment).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          service: { connect: { id: 's1' } },
          priceAtTime: 6500,
        }),
      );
    });

    it('al completar usa la transacción que actualiza lastVisitAt', async () => {
      repo.findById.mockResolvedValue(existing);
      repo.updateAppointmentWithLastVisit.mockResolvedValue({ ...existing });

      await service.updateAppointment('a1', { status: 'COMPLETED' });

      expect(repo.updateAppointmentWithLastVisit).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({ status: 'COMPLETED' }),
        existing.startsAt,
      );
      expect(repo.updateAppointment).not.toHaveBeenCalled();
    });

    it('extiende la duración recalculando endsAt', async () => {
      repo.findById.mockResolvedValue(existing);
      repo.updateAppointment.mockResolvedValue({ ...existing });

      await service.updateAppointment('a1', { durationMinutes: 60 });

      expect(repo.updateAppointment).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          endsAt: new Date('2026-12-02T11:00:00.000Z'),
        }),
      );
    });

    it('lanza 404 si el turno no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateAppointment('x', { status: 'CONFIRMED' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    const staffUser = {
      userId: 'u1',
      email: 'staff@mail.com',
      role: 'STAFF' as const,
      mustChangePassword: false,
    };

    it('STAFF no puede modificar un turno de otro empleado', async () => {
      repo.findById.mockResolvedValue(existing);
      employees.findEmployeeByUserId.mockResolvedValue({ id: 'e-otro' });

      await expect(
        service.updateAppointment('a1', { status: 'CONFIRMED' }, staffUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateAppointment).not.toHaveBeenCalled();
    });

    it('STAFF puede modificar un turno propio', async () => {
      repo.findById.mockResolvedValue(existing);
      employees.findEmployeeByUserId.mockResolvedValue({ id: 'e1' });
      repo.updateAppointment.mockResolvedValue({ ...existing });

      await service.updateAppointment('a1', { status: 'CONFIRMED' }, staffUser);

      expect(repo.updateAppointment).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({ status: 'CONFIRMED' }),
      );
    });
  });

  describe('getAvailableSlots', () => {
    it('calcula slots usando el slotMinutes del empleado', async () => {
      repo.getEmployeeWithAvailability.mockResolvedValue({
        id: 'e1',
        slotMinutes: 45,
        availability: { wed: [{ start: '09:00', end: '10:00' }] },
      });
      repo.getBusyAppointments.mockResolvedValue([]);
      vi.mocked(calculateAvailableSlots).mockReturnValue([
        { start: '2026-12-02T09:00:00.000Z', end: '2026-12-02T09:45:00.000Z' },
      ]);

      const slots = await service.getAvailableSlots({
        employeeId: 'e1',
        date: '2026-12-02',
      });

      expect(vi.mocked(calculateAvailableSlots)).toHaveBeenCalledWith(
        '2026-12-02',
        expect.anything(),
        45,
        [],
        envs.businessTimezone,
      );
      expect(slots).toHaveLength(1);
    });

    it('lanza 404 si el empleado no existe', async () => {
      repo.getEmployeeWithAvailability.mockResolvedValue(null);

      await expect(
        service.getAvailableSlots({ employeeId: 'x', date: '2026-12-02' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findPaged', () => {
    it('usa paginación por defecto y sin filtros de fecha', async () => {
      repo.findPaged.mockResolvedValue({ items: [], total: 0 });

      const res = await service.findPaged({});

      expect(repo.findPaged).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        order: 'asc',
      });
      expect(res).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    });

    it('convierte from/to a rango UTC', async () => {
      repo.findPaged.mockResolvedValue({ items: [], total: 0 });

      await service.findPaged({ from: '2026-01-01', to: '2026-01-31' });

      // Argentina (UTC-3): 00:00 local = 03:00 UTC
      expect(repo.findPaged).toHaveBeenCalledWith({
        where: {
          startsAt: {
            gte: new Date('2026-01-01T03:00:00.000Z'),
            lt: new Date('2026-02-01T03:00:00.000Z'),
          },
        },
        skip: 0,
        take: 20,
        order: 'asc',
      });
    });

    it('aplica filtros y paginación', async () => {
      repo.findPaged.mockResolvedValue({ items: [], total: 100 });

      const res = await service.findPaged({
        status: 'CONFIRMED',
        employeeId: 'e1',
        serviceId: 's1',
        q: 'Messi',
        page: 2,
        pageSize: 50,
        order: 'desc',
      });

      expect(repo.findPaged).toHaveBeenCalledWith({
        where: {
          status: 'CONFIRMED',
          employeeId: 'e1',
          serviceId: 's1',
          OR: [
            { customer: { name: { contains: 'Messi', mode: 'insensitive' } } },
            { customer: { phone: { contains: 'Messi' } } },
          ],
        },
        skip: 50,
        take: 50,
        order: 'desc',
      });
      expect(res).toEqual({ items: [], total: 100, page: 2, pageSize: 50 });
    });

    it('withoutService filtra serviceId null', async () => {
      repo.findPaged.mockResolvedValue({ items: [], total: 0 });

      await service.findPaged({ withoutService: true });

      expect(repo.findPaged).toHaveBeenCalledWith({
        where: { serviceId: null },
        skip: 0,
        take: 20,
        order: 'asc',
      });
    });

    it('STAFF solo ve su propio empleado e ignora el filtro de la query', async () => {
      employees.findEmployeeByUserId.mockResolvedValue({ id: 'e-own' });
      repo.findPaged.mockResolvedValue({ items: [], total: 0 });

      await service.findPaged(
        { employeeId: 'e-otro' },
        {
          userId: 'u1',
          email: 'staff@mail.com',
          role: 'STAFF',
          mustChangePassword: false,
        },
      );

      expect(employees.findEmployeeByUserId).toHaveBeenCalledWith('u1');
      expect(repo.findPaged).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: 'e-own' } }),
      );
    });

    it('STAFF sin empleado vinculado recibe 403', async () => {
      employees.findEmployeeByUserId.mockResolvedValue(null);

      await expect(
        service.findPaged(
          {},
          {
            userId: 'u1',
            email: 'staff@mail.com',
            role: 'STAFF',
            mustChangePassword: false,
          },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findToday', () => {
    it('STAFF solo recibe los turnos de su empleado', async () => {
      employees.findEmployeeByUserId.mockResolvedValue({ id: 'e-own' });
      repo.findToday.mockResolvedValue([]);

      await service.findToday({
        userId: 'u1',
        email: 'staff@mail.com',
        role: 'STAFF',
        mustChangePassword: false,
      });

      expect(repo.findToday).toHaveBeenCalledWith('e-own');
    });

    it('ADMIN recibe todos los turnos', async () => {
      repo.findToday.mockResolvedValue([]);

      await service.findToday({
        userId: 'admin',
        email: 'admin@mail.com',
        role: 'ADMIN',
        mustChangePassword: false,
      });

      expect(repo.findToday).toHaveBeenCalledWith(undefined);
    });
  });
});
