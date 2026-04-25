import { z } from 'zod';

export const CreateAthleteRequestDTO = z.object({
  nome: z.string().min(1, 'O nome do atleta é obrigatório.'),
  email: z.string().email('E-mail deve ter um formato válido.'),
  cpf: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, 'CPF deve conter exatamente 11 dígitos.'),
  telefone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Telefone deve estar em um formato válido.'),
  posicao: z.string().min(1, 'A posição do atleta é obrigatória.'),
  idade: z.number().min(16, 'Idade deve ser no mínimo 16.').max(50, 'Idade deve ser no máximo 50.'),
  sexo: z.enum(['M', 'F']).refine((val) => ['M', 'F'].includes(val), 'Sexo deve ser M ou F.'),
  address: z.object({
    cep: z.string().min(1, 'CEP é obrigatório.'),
    logradouro: z.string().min(1, 'Logradouro é obrigatório.'),
    numero: z.string().min(1, 'Número é obrigatório.'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório.'),
    cidade: z.string().min(1, 'Cidade é obrigatória.'),
    uf: z.string().length(2, 'UF deve ter exatamente 2 caracteres.').toUpperCase(),
  }),
  stats: z.object({
    velocidade: z.number().min(0, 'Velocidade deve ser no mínimo 0.').max(100, 'Velocidade deve ser no máximo 100.'),
    resistencia: z.number().min(0, 'Resistência deve ser no mínimo 0.').max(100, 'Resistência deve ser no máximo 100.'),
    forca: z.number().min(0, 'Força deve ser no mínimo 0.').max(100, 'Força deve ser no máximo 100.'),
    passe: z.number().min(0, 'Passe deve ser no mínimo 0.').max(100, 'Passe deve ser no máximo 100.'),
    chute: z.number().min(0, 'Chute deve ser no mínimo 0.').max(100, 'Chute deve ser no máximo 100.'),
    defesa: z.number().min(0, 'Defesa deve ser no mínimo 0.').max(100, 'Defesa deve ser no máximo 100.'),
    drible: z.number().min(0, 'Drible deve ser no mínimo 0.').max(100, 'Drible deve ser no máximo 100.'),
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isGoalkeeperForHire: z.boolean().default(false),
  pixKey: z.string().optional(),
});

export type CreateAthleteRequest = z.infer<typeof CreateAthleteRequestDTO>;