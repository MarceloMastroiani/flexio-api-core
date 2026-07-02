// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorador';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lee los roles requeridos con @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(), // busca en el método
        context.getClass(), // si no hay, busca en la clase
      ],
    );

    // 2. Si el endpoint no tiene @Roles(), dejalo pasar (no requiere rol específico)
    if (!requiredRoles) {
      return true;
    }

    // 3. Compara contra el usuario que dejó el JwtStrategy en req.user
    const { user } = context.switchToHttp().getRequest(); // Obtiene el usuario autenticado
    return requiredRoles.some((role) => user.role === role);
  }
}
