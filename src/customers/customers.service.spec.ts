import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';

describe('CustomersService', () => {
  let service: CustomersService;

  const repo = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByPhone: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: CustomersRepository, useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(CustomersService);
  });

  describe('createCustomer', () => {
    it('crea un cliente solo con teléfono', async () => {
      repo.findByPhone.mockResolvedValue(null);
      repo.create.mockResolvedValue({
        id: 'c1',
        name: 'X',
        phone: '123',
        email: null,
      });

      await service.createCustomer({ name: 'X', phone: '123' });

      expect(repo.create).toHaveBeenCalledWith({ name: 'X', phone: '123' });
    });

    it('lanza 400 si no se proporciona teléfono ni email', async () => {
      await expect(
        service.createCustomer({ name: 'X' }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('lanza 400 si el teléfono ya existe', async () => {
      repo.findByPhone.mockResolvedValue({ id: 'existing' });

      const promise = service.createCustomer({ name: 'X', phone: '123' });
      await expect(promise).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('lanza 400 si el email ya existe', async () => {
      repo.findByPhone.mockResolvedValue(null);
      repo.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createCustomer({ name: 'X', email: 'a@b.com' }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
    });
  });

  describe('findByPhone', () => {
    it('devuelve el cliente si existe', async () => {
      repo.findByPhone.mockResolvedValue({ id: 'c1', name: 'X', phone: '123' });

      const result = await service.findByPhone('123');
      expect(result).toEqual({ id: 'c1', name: 'X', phone: '123' });
    });
  });
});
