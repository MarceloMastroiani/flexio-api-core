// roles.guard.ts
import {
  ForbiddenException,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorador';

interface RequestWithUser {
  user?: { role?: string; mustChangePassword?: boolean };
}

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
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    // 4. Si el usuario tiene una contraseña temporal pendiente, no puede
    //    usar el resto de la API hasta cambiarla.
    if (user?.mustChangePassword) {
      throw new ForbiddenException(
        'Debés cambiar la contraseña antes de continuar',
      );
    }

    return requiredRoles.some((role) => user?.role === role);
  }
}
