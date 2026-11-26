import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { AuthService } from '../auth/auth.service';
import { Prisma } from '../../generated/prisma/client';

vi.mock('../common/helpers/hash-password.helpers', () => ({
  hashPassword: vi.fn(),
  generateTemporaryPassword: vi.fn(),
}));

import {
  generateTemporaryPassword,
  hashPassword,
} from '../common/helpers/hash-password.helpers';

const mockHashPassword = vi.mocked(hashPassword);
const mockGenerateTemporaryPassword = vi.mocked(generateTemporaryPassword);

describe('EmployeesService', () => {
  let service: EmployeesService;

  const repo = {
    createEmployeeWithUser: vi.fn(),
    createEmployee: vi.fn(),
    findAllEmployees: vi.fn(),
    findPublicEmployees: vi.fn(),
    findOneEmployee: vi.fn(),
    findByUserId: vi.fn(),
    deleteEmployee: vi.fn(),
    updateEmployee: vi.fn(),
  };
  const auth = { findOneUser: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHashPassword.mockResolvedValue('hashed-password');
    mockGenerateTemporaryPassword.mockReturnValue('temp-123456');

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repo },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    service = moduleRef.get(EmployeesService);
  });

  describe('createEmployeeWithUser', () => {
    const dto = {
      name: 'Nito',
      email: 'nito@mail.com',
      availability: { mon: [{ start: '09:00', end: '18:00' }] },
      slotMinutes: 45,
    };

    it('crea usuario + empleado y no devuelve contraseña si la eligió el ADMIN', async () => {
      repo.createEmployeeWithUser.mockResolvedValue({
        employee: { id: 'e1', name: 'Nito', userId: 'u1' },
        user: { id: 'u1', email: 'nito@mail.com', role: 'STAFF' },
      });

      const result = await service.createEmployeeWithUser({
        ...dto,
        password: 'temporal123',
      });

      expect(repo.createEmployeeWithUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'nito@mail.com', slotMinutes: 45 }),
        'hashed-password',
      );
      expect(result).toEqual({ id: 'e1', name: 'Nito', userId: 'u1' });
      expect(result).not.toHaveProperty('temporaryPassword');
    });

    it('genera y devuelve una contraseña temporal si no se envía', async () => {
      repo.createEmployeeWithUser.mockResolvedValue({
        employee: { id: 'e1', name: 'Nito', userId: 'u1' },
        user: { id: 'u1', email: 'nito@mail.com', role: 'STAFF' },
      });

      const result = await service.createEmployeeWithUser(dto);

      expect(mockGenerateTemporaryPassword).toHaveBeenCalled();
      expect(result).toMatchObject({ temporaryPassword: 'temp-123456' });
    });

    it('lanza 409 si el email ya existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'unique constraint',
        { code: 'P2002', clientVersion: 'test' },
      );
      repo.createEmployeeWithUser.mockRejectedValue(prismaError);

      await expect(service.createEmployeeWithUser(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('createEmployee (vincular usuario existente)', () => {
    const dto = {
      name: 'Nito',
      availability: { mon: [{ start: '09:00', end: '18:00' }] },
      slotMinutes: 45,
    };

    it('usa el email del usuario vinculado y crea con slotMinutes', async () => {
      auth.findOneUser.mockResolvedValue({
        id: 'u1',
        email: 'nito@mail.com',
        role: 'STAFF',
      });
      repo.findByUserId.mockResolvedValue(null);
      repo.createEmployee.mockResolvedValue({ id: 'e1' });

      await service.createEmployee('u1', dto);

      expect(repo.createEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'nito@mail.com', slotMinutes: 45 }),
        'u1',
      );
    });

    it('lanza 400 si el email enviado no coincide con el del usuario', async () => {
      auth.findOneUser.mockResolvedValue({
        id: 'u1',
        email: 'nito@mail.com',
        role: 'STAFF',
      });
      repo.findByUserId.mockResolvedValue(null);

      await expect(
        service.createEmployee('u1', { ...dto, email: 'otro@mail.com' }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('lanza 400 si el usuario no es STAFF', async () => {
      auth.findOneUser.mockResolvedValue({
        id: 'u1',
        email: 'admin@mail.com',
        role: 'ADMIN',
      });

      await expect(service.createEmployee('u1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lanza 409 si el usuario ya está vinculado', async () => {
      auth.findOneUser.mockResolvedValue({
        id: 'u1',
        email: 'nito@mail.com',
        role: 'STAFF',
      });
      repo.findByUserId.mockResolvedValue({ id: 'e1' });

      await expect(service.createEmployee('u1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findAllEmployees', () => {
    it('ADMIN recibe todos los empleados', async () => {
      repo.findAllEmployees.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);

      await expect(
        service.findAllEmployees({
          userId: 'admin',
          email: 'a@a.com',
          role: 'ADMIN',
          mustChangePassword: false,
        }),
      ).resolves.toHaveLength(2);
    });

    it('STAFF solo recibe su propio empleado (id y nombre)', async () => {
      repo.findByUserId.mockResolvedValue({
        id: 'e1',
        name: 'Nito',
        email: 'nito@mail.com',
      });

      await expect(
        service.findAllEmployees({
          userId: 'u1',
          email: 'nito@mail.com',
          role: 'STAFF',
          mustChangePassword: false,
        }),
      ).resolves.toEqual([{ id: 'e1', name: 'Nito' }]);
    });

    it('STAFF sin empleado recibe 403', async () => {
      repo.findByUserId.mockResolvedValue(null);

      await expect(
        service.findAllEmployees({
          userId: 'u1',
          email: 'nito@mail.com',
          role: 'STAFF',
          mustChangePassword: false,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
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
