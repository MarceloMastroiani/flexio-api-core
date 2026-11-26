import { Role } from '../../../generated/prisma/client';

/** Usuario autenticado que deja el JwtStrategy en `req.user`. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}
