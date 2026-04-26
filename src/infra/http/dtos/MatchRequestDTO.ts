import { z } from 'zod';

export const CreateMatchRequestDTO = z.object({
  adminId:          z.string().uuid(),
  groupId:          z.string().uuid(),
  type:             z.enum(['CAMPO', 'SOCIETY', 'FUTSAL']),
  date:             z.coerce.date(),
  location:         z.string().min(3),
  latitude:         z.number(),
  longitude:        z.number(),
  totalVacancies:   z.number().int().min(1),
  reserveVacancies: z.number().int().min(0).default(0),
  spotRadiusKm:     z.number().positive().default(10),
  minOverall:       z.number().int().min(0).max(100).default(0),
  minAge:           z.number().int().min(16).default(16),
  maxAge:           z.number().int().max(99).default(99),
});

export const RespondMatchInviteRequestDTO = z.object({
  athleteId: z.string().uuid(),
  accept:    z.boolean(),
});

export const OpenVacanciesRequestDTO = z.object({
  adminId: z.string().uuid(),
});

export const ConfirmPresenceRequestDTO = z.object({
  athleteId: z.string().uuid(),
});

export const CheckInRequestDTO = z.object({
  athleteId: z.string().uuid(),
});

export const RegisterRatingRequestDTO = z.object({
  ratedBy:      z.string().uuid(),
  ratedAthlete: z.string().uuid(),
  stats: z.object({
    pace:      z.number().int().min(0).max(100),
    shooting:  z.number().int().min(0).max(100),
    passing:   z.number().int().min(0).max(100),
    dribbling: z.number().int().min(0).max(100),
    defense:   z.number().int().min(0).max(100),
    physical:  z.number().int().min(0).max(100),
  }),
});

export const MatchmakingRequestDTO = z.object({
  teamsCount: z.number().int().min(2).max(4).default(2),
});

export const CancelMatchRequestDTO = z.object({
  adminId: z.string().uuid(),
  reason:  z.string().min(10, 'Reason must have at least 10 characters'),
});
