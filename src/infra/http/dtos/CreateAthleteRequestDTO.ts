import { z } from 'zod';

export const CreateAthleteRequestDTO = z.object({
  name: z.string().min(1, 'Athlete name is required.'),
  email: z.string().email('Email must have a valid format.'),
  cpf: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, 'CPF must contain exactly 11 digits.'),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Phone must be in a valid format.'),
  age: z.number().min(16, 'Age must be at least 16.').max(99, 'Age must be at most 99.'),
  gender: z.enum(['M', 'F']),
  address: z.object({
    cep: z.string().min(1, 'CEP is required.'),
    street: z.string().min(1, 'Street is required.'),
    number: z.string().min(1, 'Number is required.'),
    complement: z.string().optional().transform(v => v ?? undefined),
    neighborhood: z.string().min(1, 'Neighborhood is required.'),
    city: z.string().min(1, 'City is required.'),
    state: z.string().length(2, 'State must have exactly 2 characters.').toUpperCase(),
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isGoalkeeperForHire: z.boolean().default(false),
  password: z.string().min(6, 'Password must have at least 6 characters').optional(),
  tempToken: z.string().optional(),
}).refine((d) => d.password || d.tempToken, {
  message: 'Either password or tempToken must be provided',
});

export type CreateAthleteRequest = z.infer<typeof CreateAthleteRequestDTO>;

export const UpdateLocationRequestDTO = z.object({
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
