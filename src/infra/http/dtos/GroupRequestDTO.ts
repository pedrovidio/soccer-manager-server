import { z } from 'zod';

export const CreateGroupRequestDTO = z.object({
  adminId: z.string().uuid(),
  name: z.string().min(3, 'Group name must have at least 3 characters'),
  description: z.string().min(1, 'Description cannot be empty'),
  pixKey: z.string().optional(),
  baseLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export const AddMemberRequestDTO = z.object({
  adminId: z.string().uuid(),
  athleteId: z.string().uuid(),
});

export const InviteAthleteRequestDTO = z.object({
  adminId: z.string().uuid(),
  athleteId: z.string().uuid(),
});

export const RespondInviteRequestDTO = z.object({
  athleteId: z.string().uuid(),
  accept: z.boolean(),
});

export const SearchAthletesRequestDTO = z.object({
  name:  z.string().optional(),
  cpf:   z.string().optional(),
  email: z.string().optional(),
}).refine((d) => d.name || d.cpf || d.email, {
  message: 'At least one search filter must be provided',
});
