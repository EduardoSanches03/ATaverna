import { z } from 'zod';

// Só minúsculas: "Ana" e "ana" seriam o mesmo nome para quem convida, então só um deles pode existir.
export const usernameSchema = z
  .string()
  .regex(/^[a-z0-9_]{3,30}$/, 'Use de 3 a 30 caracteres: letras minúsculas, números e _');

export const passwordSchema = z.string().min(8, 'Use ao menos 8 caracteres').max(128, 'Use no máximo 128 caracteres');

export const registerSchema = z.object({ username: usernameSchema, password: passwordSchema });

// O login não valida o formato: qualquer erro vira a mesma resposta genérica.
export const credentialsSchema = z.object({ username: z.string(), password: z.string() });

export type Credentials = z.infer<typeof credentialsSchema>;

export const userResponseSchema = z.object({ username: z.string() });

export type UserResponse = z.infer<typeof userResponseSchema>;
