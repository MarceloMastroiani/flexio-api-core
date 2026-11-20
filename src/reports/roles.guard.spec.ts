import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from '../common/guards/roles.guard';

function contextWithRole(role: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
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
});
