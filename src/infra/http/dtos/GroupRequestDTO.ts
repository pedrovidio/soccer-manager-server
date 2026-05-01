import { z } from 'zod';

export const CreateGroupRequestDTO = z.object({
  adminId: z.string().uuid(),
  name: z.string().min(3, 'Group name must have at least 3 characters'),
  description: z.string().optional(),
  pixKey: z.string().optional(),
  monthlyFee: z.number().min(0).optional(),
  baseLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  goalkeeperPaymentMode: z.enum(['SPLIT', 'MONTHLY', 'FREE']).optional(),
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
  name:        z.string().optional(),
  cpf:         z.string().optional(),
  email:       z.string().optional(),
  groupId:     z.string().uuid().optional(),
  requesterId: z.string().uuid().optional(),
}).refine((d) => d.name || d.cpf || d.email, {
  message: 'At least one search filter must be provided',
});

export const DelegateAdminRequestDTO = z.object({
  requesterId: z.string().uuid(),
  delegatedTo: z.string().uuid(),
  isPermanent: z.boolean(),
  matchesLimit: z.number().int().min(1).optional(),
}).refine((d) => d.isPermanent || d.matchesLimit !== undefined, {
  message: 'matchesLimit is required for temporary delegations',
});

export const RevokeAdminRequestDTO = z.object({
  requesterId: z.string().uuid(),
  delegatedTo: z.string().uuid(),
});

export const UpdateGroupRequestDTO = z.object({
  requesterId: z.string().uuid(),
  name: z.string().min(3, 'Group name must have at least 3 characters').optional(),
  description: z.string().optional(),
  pixKey: z.string().optional(),
  monthlyFee: z.number().min(0).optional(),
  goalkeeperPaymentMode: z.enum(['SPLIT', 'MONTHLY', 'FREE']).optional(),
});
