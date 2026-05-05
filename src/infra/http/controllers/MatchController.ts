import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  CreateMatchRequestDTO,
  RespondMatchInviteRequestDTO,
  OpenVacanciesRequestDTO,
  ConfirmPresenceRequestDTO,
  CheckInRequestDTO,
  RegisterRatingRequestDTO,
  MatchmakingRequestDTO,
  CancelMatchRequestDTO,
} from '../dtos/MatchRequestDTO.js';
import { CreateMatchUseCase } from '../../../core/use-cases/CreateMatchUseCase.js';
import { RespondMatchInviteUseCase } from '../../../core/use-cases/RespondMatchInviteUseCase.js';
import { OpenMatchVacanciesUseCase } from '../../../core/use-cases/OpenMatchVacanciesUseCase.js';
import { ConfirmPresenceUseCase } from '../../../core/use-cases/ConfirmPresenceUseCase.js';
import { CheckInUseCase } from '../../../core/use-cases/CheckInUseCase.js';
import { RegisterRatingUseCase } from '../../../core/use-cases/RegisterRatingUseCase.js';
import { MatchmakingUseCase } from '../../../core/use-cases/MatchmakingUseCase.js';
import { CancelMatchUseCase } from '../../../core/use-cases/CancelMatchUseCase.js';
import { PrismaMatchRepository } from '../../database/prisma/repositories/PrismaMatchRepository.js';
import { PrismaMatchInviteRepository } from '../../database/prisma/repositories/PrismaMatchInviteRepository.js';
import { PrismaGroupRepository } from '../../database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaNotificationRepository } from '../../database/prisma/repositories/PrismaNotificationRepository.js';
import { PrismaPerformanceRatingRepository } from '../../database/prisma/repositories/PrismaPerformanceRatingRepository.js';
import { WhatsAppService } from '../../services/WhatsAppService.js';
import { Match } from '../../../core/domain/entities/Match.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../database/prisma/client.js';

export class MatchController {
  async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const matchRepo = new PrismaMatchRepository(prisma);
      const athleteRepo = new PrismaAthleteRepository();

      const match = await matchRepo.findById(matchId);
      if (!match) { res.status(404).json({ error: 'Match not found' }); return; }

      // Busca todos os membros do grupo para montar lista de presença completa
      const groupRaw = await prisma.group.findUnique({
        where: { id: match.groupId },
        select: { memberIds: true },
      });
      const memberIds: string[] = groupRaw?.memberIds ?? [];

      const presence = await Promise.all(
        memberIds.map(async (athleteId) => {
          const athlete = await athleteRepo.findById(athleteId);
          if (!athlete) return null;
          const s = athlete.getStats();
          const overall = Math.round((s.pace + s.shooting + s.passing + s.dribbling + s.defense + s.physical) / 6);
          const status = match.confirmedIds.includes(athleteId) ? 'CONFIRMED' : 'PENDING';
          return { athleteId, name: athlete.name, position: athlete.position, overall, status, isGuest: false };
        })
      );

      res.status(200).json({
        id: match.id,
        groupId: match.groupId,
        date: match.date,
        location: match.location,
        latitude: match.latitude,
        longitude: match.longitude,
        type: match.type,
        status: match.status,
        totalVacancies: match.totalVacancies,
        reserveVacancies: match.reserveVacancies,
        confirmedCount: match.confirmedIds.length,
        isRecurring: match.isRecurring,
        guestConfig: null,
        presence: presence.filter(Boolean),
      });
    } catch (error) { this.handleError(error, res); }
  }

  async nearbyAthletes(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const match = await new PrismaMatchRepository(prisma).findById(matchId);
      if (!match) { res.status(404).json({ error: 'Match not found' }); return; }

      // Busca atletas que não são membros do grupo
      const group = await prisma.group.findUnique({
        where: { id: match.groupId },
        select: { memberIds: true, adminIds: true },
      });
      const groupMemberIds = new Set([...(group?.memberIds ?? []), ...(group?.adminIds ?? [])]);

      const athletes = await prisma.athlete.findMany({
        where: {
          isInjured:    false,
          financialDebt: 0,
          latitude:  { not: null },
          longitude: { not: null },
        },
        select: {
          id: true, age: true, gender: true, position: true,
          statsPace: true, statsShooting: true, statsPassing: true,
          statsDribbling: true, statsDefense: true, statsPhysical: true,
          latitude: true, longitude: true,
        },
      });

      // Jitter ~500m para privacidade (0.005 graus ≈ 550m)
      function jitter(v: number) { return v + (Math.random() - 0.5) * 0.009; }

      const result = athletes
        .filter((a) => !groupMemberIds.has(a.id))
        .map((a) => ({
          id:              a.id,
          approxLatitude:  jitter(a.latitude!),
          approxLongitude: jitter(a.longitude!),
          overall: Math.round((a.statsPace + a.statsShooting + a.statsPassing + a.statsDribbling + a.statsDefense + a.statsPhysical) / 6),
          age:      a.age,
          gender:   a.gender,
          position: a.position,
        }));

      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const { type, date, location, totalVacancies, reserveVacancies, isRecurring } = req.body;
      const matchRepo = new PrismaMatchRepository(prisma);

      const match = await matchRepo.findById(matchId);
      if (!match) { res.status(404).json({ error: 'Match not found' }); return; }

      const updated = new Match(
        match.groupId,
        type             ?? match.type,
        date             ? new Date(date) : match.date,
        location         ?? match.location,
        match.latitude,
        match.longitude,
        totalVacancies   != null ? Number(totalVacancies)   : match.totalVacancies,
        reserveVacancies != null ? Number(reserveVacancies) : match.reserveVacancies,
        match.spotRadiusKm,
        match.minOverall,
        match.minAge,
        match.maxAge,
        match.confirmedIds,
        match.checkedInIds,
        match.status,
        match.id,
        isRecurring != null ? Boolean(isRecurring) : match.isRecurring,
      );
      await matchRepo.save(updated);
      res.status(200).json({ success: true });
    } catch (error) { this.handleError(error, res); }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateMatchRequestDTO.parse(req.body);
      const result = await new CreateMatchUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaMatchInviteRepository(prisma),
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaNotificationRepository(prisma),
        new WhatsAppService(),
      ).execute(data);
      res.status(201).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async listByGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const matches = await new PrismaMatchRepository(prisma).listByGroup(groupId);
      res.status(200).json(matches.map((m) => ({
        id: m.id, type: m.type, date: m.date, location: m.location,
        totalVacancies: m.totalVacancies, reserveVacancies: m.reserveVacancies,
        confirmedCount: m.confirmedIds.length, checkedInCount: m.checkedInIds.length,
        status: m.status,
      })));
    } catch (error) { this.handleError(error, res); }
  }

  async respondInvite(req: Request, res: Response): Promise<void> {
    try {
      const inviteId = req.params['inviteId'] as string;
      const data = RespondMatchInviteRequestDTO.parse(req.body);
      const result = await new RespondMatchInviteUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaMatchInviteRepository(prisma),
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaNotificationRepository(prisma),
      ).execute({ inviteId, athleteId: data.athleteId, accept: data.accept });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async openVacancies(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const data = OpenVacanciesRequestDTO.parse(req.body);
      const result = await new OpenMatchVacanciesUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaMatchInviteRepository(prisma),
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaNotificationRepository(prisma),
        new WhatsAppService(),
      ).execute({ matchId, adminId: data.adminId });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async confirmPresence(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const { athleteId } = ConfirmPresenceRequestDTO.parse(req.body);
      const result = await new ConfirmPresenceUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaMatchInviteRepository(prisma),
        new PrismaAthleteRepository(),
      ).execute({ matchId, athleteId });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const { athleteId } = CheckInRequestDTO.parse(req.body);
      const result = await new CheckInUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaAthleteRepository(),
      ).execute({ matchId, athleteId });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async registerRating(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const data = RegisterRatingRequestDTO.parse(req.body);
      const result = await new RegisterRatingUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaPerformanceRatingRepository(prisma),
      ).execute({ matchId, ...data });
      res.status(201).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async matchmaking(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const { teamsCount } = MatchmakingRequestDTO.parse(req.body);
      const result = await new MatchmakingUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaAthleteRepository(),
      ).execute({ matchId, teamsCount });
      res.status(200).json(result);
    } catch (error) { this.handleError(error, res); }
  }

  async cancelMatch(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const { adminId, reason } = CancelMatchRequestDTO.parse(req.body);
      await new CancelMatchUseCase(
        new PrismaMatchRepository(prisma),
        new PrismaMatchInviteRepository(prisma),
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaNotificationRepository(prisma),
      ).execute({ matchId, adminId, reason });
      res.status(200).json({ success: true });
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
