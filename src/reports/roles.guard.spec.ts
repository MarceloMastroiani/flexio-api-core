import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from '../common/guards/roles.guard';

function contextWithRole(
  role: string,
  mustChangePassword = false,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role, mustChangePassword } }),
    }),
  } as unknown as ExecutionContext;
}

function guardRequiringAdmin(): RolesGuard {
  const reflector = {
    getAllAndOverride: () => ['ADMIN'],
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard (@Roles(ADMIN) reports)', () => {
  it('permite a un usuario ADMIN', () => {
    expect(guardRequiringAdmin().canActivate(contextWithRole('ADMIN'))).toBe(
      true,
    );
  });

  it('bloquea a un usuario STAFF', () => {
    expect(guardRequiringAdmin().canActivate(contextWithRole('STAFF'))).toBe(
      false,
    );
  });

  it('bloquea si debe cambiar la contraseña, incluso siendo ADMIN', () => {
    expect(() =>
      guardRequiringAdmin().canActivate(contextWithRole('ADMIN', true)),
    ).toThrow(ForbiddenException);
  });

  it('deja pasar si no hay roles requeridos (perfil / cambio de clave)', () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextWithRole('STAFF', true))).toBe(true);
  });
});
