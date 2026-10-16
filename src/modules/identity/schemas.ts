import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identifier minimal 3 karakter')
    .max(100, 'Identifier maksimal 100 karakter')
    .trim(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z
      .string()
      .min(10, 'Password baru minimal 10 karakter sesuai standar keamanan SIAJAR')
      .regex(/[A-Z]/, 'Harus memuat minimal satu huruf besar')
      .regex(/[0-9]/, 'Harus memuat minimal satu angka')
      .regex(/[^A-Za-z0-9]/, 'Harus memuat minimal satu simbol khusus'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordRequestSchema = z.object({
  identifier: z.string().min(3, 'Identifier minimal 3 karakter').trim(),
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

export const switchWorkspaceSchema = z.object({
  roleCode: z.enum([
    'STUDENT',
    'LECTURER',
    'TEACHING_ASSISTANT',
    'PROGRAM_COORDINATOR',
    'ACADEMIC_STAFF',
    'SYSTEM_ADMIN',
    'SUPER_ADMIN',
  ]),
  scopeId: z.string().uuid().nullable().optional(),
});

export type SwitchWorkspaceInput = z.infer<typeof switchWorkspaceSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Nama lengkap minimal 2 karakter').trim(),
    identifier: z.string().min(3, 'NIM/NIDN/NIP/Username minimal 3 karakter').trim(),
    email: z.string().email('Format email tidak valid').trim(),
    role: z.enum([
      'STUDENT',
      'LECTURER',
      'TEACHING_ASSISTANT',
      'PROGRAM_COORDINATOR',
      'ACADEMIC_STAFF',
      'SYSTEM_ADMIN',
    ]),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

