import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { AuthService } from '../auth/auth.service';

describe('EmployeesService', () => {
  let service: EmployeesService;

  const repo = {
    createEmployee: vi.fn(),
    findAllEmployees: vi.fn(),
    findPublicEmployees: vi.fn(),
    findOneEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
    updateEmployee: vi.fn(),
  };
  const auth = { findOneUser: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repo },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    service = moduleRef.get(EmployeesService);
  });

  describe('createEmployee', () => {
    const dto = {
      name: 'Nito',
      availability: { mon: [{ start: '09:00', end: '18:00' }] },
      slotMinutes: 45,
    };

    it('usa el email del usuario vinculado y crea con slotMinutes', async () => {
      auth.findOneUser.mockResolvedValue({ id: 'u1', email: 'nito@mail.com' });
      repo.createEmployee.mockResolvedValue({ id: 'e1' });

      await service.createEmployee('u1', dto);

      expect(repo.createEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'nito@mail.com', slotMinutes: 45 }),
        'u1',
      );
    });

    it('lanza 400 si el email enviado no coincide con el del usuario', async () => {
      auth.findOneUser.mockResolvedValue({ id: 'u1', email: 'nito@mail.com' });

      await expect(
        service.createEmployee('u1', { ...dto, email: 'otro@mail.com' }),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('findOneEmployee', () => {
    it('devuelve null si no existe (sin lanzar error)', async () => {
      repo.findOneEmployee.mockResolvedValue(null);

      await expect(service.findOneEmployee('x')).resolves.toBeNull();
    });
  });

  describe('findPublicEmployees', () => {
    it('devuelve la lista reducida', async () => {
      repo.findPublicEmployees.mockResolvedValue([{ id: 'e1', name: 'Nito' }]);

      await expect(service.findPublicEmployees()).resolves.toEqual([
        { id: 'e1', name: 'Nito' },
      ]);
    });
  });
});
