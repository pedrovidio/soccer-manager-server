import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { RegisterMatchScoreUseCase } from '../../../core/use-cases/RegisterMatchScoreUseCase.js';
import { GetGroupMatchHistoryUseCase } from '../../../core/use-cases/GetGroupMatchHistoryUseCase.js';
import { GetAthleteMatchHistoryUseCase, GetAthleteDashboardUseCase } from '../../../core/use-cases/GetAthleteDashboardUseCase.js';
import { PrismaMatchRepository } from '../../database/prisma/repositories/PrismaMatchRepository.js';
import { PrismaMatchScoreRepository, PrismaMatchHistoryRepository } from '../../database/prisma/repositories/PrismaMatchHistoryRepository.js';
import { PrismaGroupRepository } from '../../database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaPerformanceRatingRepository } from '../../database/prisma/repositories/PrismaPerformanceRatingRepository.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../database/prisma/client.js';

const RegisterScoreDTO = z.object({
  registeredBy: z.string().uuid(),
  scores: z.array(z.object({
    teamName: z.string().min(1),
    goals: z.number().int().min(0),
  })).min(2),
});

const HistoryFiltersDTO = z.object({
  status:   z.enum(['FINISHED', 'CANCELLED']).optional(),
  type:     z.enum(['CAMPO', 'SOCIETY', 'FUTSAL']).optional(),
  from:     z.coerce.date().optional(),
  to:       z.coerce.date().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export class HistoryController {
  async registerScore(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const data = RegisterScoreDTO.parse(req.body);
      await new RegisterMatchScoreUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaMatchScoreRepository(prisma),
      ).execute({ matchId, ...data });
      res.status(201).json({ success: true });
    } catch (error) { this.handleError(error, res); }
  }

  async groupHistory(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const requesterId = req.query['requesterId'] as string;
      const filters = HistoryFiltersDTO.parse(req.query);
      const result = await new GetGroupMatchHistoryUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaMatchHistoryRepository(prisma),
      ).execute({
        groupId,
        requesterId,
        filters: {
          page:     filters.page,
          pageSize: filters.pageSize,
          ...(filters.status !== undefined && { status: filters.status }),
          ...(filters.type   !== undefined && { type:   filters.type }),
          ...(filters.from   !== undefined && { from:   filters.from }),
          ...(filters.to     !== undefined && { to:     filters.to }),
        },
      });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async athleteHistory(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const filters = HistoryFiltersDTO.parse(req.query);
      const result = await new GetAthleteMatchHistoryUseCase(
        new PrismaMatchHistoryRepository(prisma),
      ).execute(athleteId, {
        page:     filters.page,
        pageSize: filters.pageSize,
        ...(filters.status !== undefined && { status: filters.status }),
        ...(filters.type   !== undefined && { type:   filters.type }),
        ...(filters.from   !== undefined && { from:   filters.from }),
        ...(filters.to     !== undefined && { to:     filters.to }),
      });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async athleteDashboard(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const result = await new GetAthleteDashboardUseCase(
        new PrismaAthleteRepository(),
        new PrismaPerformanceRatingRepository(prisma),
        new PrismaMatchHistoryRepository(prisma),
      ).execute(athleteId);
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })) });
    } else if (error instanceof EntityNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
    } else if (error instanceof BusinessRuleViolationError) {
      res.status(409).json({ error: error.message, code: error.code });
    } else if (error instanceof DomainError) {
      res.status(400).json({ error: error.message, code: error.code });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}
