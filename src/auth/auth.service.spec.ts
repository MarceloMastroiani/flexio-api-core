import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

// Mock del helper de hash para no depender de bcrypt en los tests
vi.mock('../common/helpers/hash-password.helpers', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
  generateTemporaryPassword: vi.fn(),
}));

import {
  comparePassword,
  generateTemporaryPassword,
  hashPassword,
} from '../common/helpers/hash-password.helpers';

const mockComparePassword = vi.mocked(comparePassword);
const mockHashPassword = vi.mocked(hashPassword);
const mockGenerateTemporaryPassword = vi.mocked(generateTemporaryPassword);

interface ValidatedUser {
  id: string;
  email: string;
  role: string;
}

describe('AuthService', () => {
  let service: AuthService;

  const authRepository = {
    findOneByEmail: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findProfile: vi.fn(),
    findOneWithPassword: vi.fn(),
    updatePassword: vi.fn(),
  };

  const jwtService = {
    sign: vi.fn().mockReturnValue('signed-token'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHashPassword.mockResolvedValue('hashed-password');
    mockGenerateTemporaryPassword.mockReturnValue('temp-123456');

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('validateUser', () => {
    const user = {
      id: 'user-1',
      email: 'admin@pelu',
      password: 'hashed-password',
      role: 'ADMIN',
      mustChangePassword: false,
      createdAt: new Date(),
    };

    it('devuelve el usuario sin password cuando las credenciales son válidas', async () => {
      authRepository.findOneByEmail.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);

      const result = (await service.validateUser(
        'admin@pelu',
        '1234',
      )) as ValidatedUser;

      expect(authRepository.findOneByEmail).toHaveBeenCalledWith('admin@pelu');
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('admin@pelu');
      expect(result.role).toBe('ADMIN');
    });

    it('lanza 401 si el email no existe', async () => {
      authRepository.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('x@y.com', '1234'),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('lanza 401 si la contraseña no coincide', async () => {
      authRepository.findOneByEmail.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(false);

      await expect(
        service.validateUser('admin@pelu', 'mal'),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('login', () => {
    it('firma el JWT con el payload correcto', () => {
      const result = service.login({
        id: 'user-1',
        email: 'admin@pelu',
        role: 'ADMIN',
        createdAt: new Date(),
      });

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'admin@pelu',
        sub: 'user-1',
        role: 'ADMIN',
        mustChangePassword: false,
      });
    });

    it('incluye mustChangePassword en el token', () => {
      service.login({
        id: 'user-1',
        email: 'nuevo@pelu',
        role: 'STAFF',
        mustChangePassword: true,
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ mustChangePassword: true }),
      );
    });
  });

  describe('getProfile', () => {
    it('devuelve el perfil con employeeId y el flag', async () => {
      authRepository.findProfile.mockResolvedValue({
        id: 'u1',
        email: 'staff@mail.com',
        role: 'STAFF',
        mustChangePassword: true,
        employee: { id: 'e1' },
      });

      await expect(service.getProfile('u1')).resolves.toEqual({
        userId: 'u1',
        email: 'staff@mail.com',
        role: 'STAFF',
        mustChangePassword: true,
        employeeId: 'e1',
      });
    });

    it('employeeId es null si no está vinculado', async () => {
      authRepository.findProfile.mockResolvedValue({
        id: 'u1',
        email: 'admin@mail.com',
        role: 'ADMIN',
        mustChangePassword: false,
        employee: null,
      });

      const profile = await service.getProfile('u1');
      expect(profile.employeeId).toBeNull();
    });

    it('lanza 404 si el usuario no existe', async () => {
      authRepository.findProfile.mockResolvedValue(null);

      await expect(service.getProfile('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('changeOwnPassword', () => {
    const user = {
      id: 'u1',
      email: 'staff@mail.com',
      password: 'current-hash',
      role: 'STAFF',
      mustChangePassword: true,
      createdAt: new Date(),
    };

    it('actualiza la contraseña, limpia el flag y firma un token nuevo', async () => {
      authRepository.findOneWithPassword.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('new-hash');

      const result = await service.changeOwnPassword('u1', {
        currentPassword: 'actual123',
        newPassword: 'nueva1234',
      });

      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        'u1',
        'new-hash',
        false,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ mustChangePassword: false }),
      );
      expect(result).toEqual({ access_token: 'signed-token' });
    });

    it('rechaza si la contraseña actual no coincide', async () => {
      authRepository.findOneWithPassword.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(false);

      await expect(
        service.changeOwnPassword('u1', {
          currentPassword: 'mal',
          newPassword: 'nueva1234',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('rechaza si la nueva contraseña es igual a la actual', async () => {
      authRepository.findOneWithPassword.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);

      await expect(
        service.changeOwnPassword('u1', {
          currentPassword: 'misma1234',
          newPassword: 'misma1234',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza 404 si el usuario no existe', async () => {
      authRepository.findOneWithPassword.mockResolvedValue(null);

      await expect(
        service.changeOwnPassword('x', {
          currentPassword: 'a',
          newPassword: 'bbbbbbbb',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('usa la contraseña indicada por el ADMIN y marca el cambio obligatorio', async () => {
      authRepository.findOne.mockResolvedValue({
        id: 'u1',
        email: 'staff@mail.com',
        role: 'STAFF',
      });
      mockHashPassword.mockResolvedValue('temp-hash');

      const result = await service.resetPassword('u1', {
        password: 'temporal123',
      });

      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        'u1',
        'temp-hash',
        true,
      );
      expect(result).toEqual({ temporaryPassword: 'temporal123' });
    });

    it('genera una temporal si no se envía contraseña', async () => {
      authRepository.findOne.mockResolvedValue({
        id: 'u1',
        email: 'staff@mail.com',
        role: 'STAFF',
      });

      const result = await service.resetPassword('u1', {});

      expect(result).toEqual({ temporaryPassword: 'temp-123456' });
    });

    it('lanza 404 si el usuario no existe', async () => {
      authRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('x', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
