import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

// Mock del helper de hash para no depender de bcrypt en los tests
vi.mock('../common/helpers/hash-password.helpers', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

import { comparePassword } from '../common/helpers/hash-password.helpers';

const mockComparePassword = vi.mocked(comparePassword);

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
  };

  const jwtService = {
    sign: vi.fn().mockReturnValue('signed-token'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

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
    it('firma el JWT con el payload correcto', async () => {
      const result = await service.login({
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
      });
    });
  });
});
