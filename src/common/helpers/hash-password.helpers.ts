import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

/** Contraseña temporal aleatoria: 9 bytes → 12 caracteres base64url. */
export const generateTemporaryPassword = (): string =>
  randomBytes(9).toString('base64url');
