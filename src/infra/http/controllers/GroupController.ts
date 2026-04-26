import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  CreateGroupRequestDTO,
  InviteAthleteRequestDTO,
  RespondInviteRequestDTO,
  SearchAthletesRequestDTO,
  DelegateAdminRequestDTO,
  RevokeAdminRequestDTO,
} from '../dtos/GroupRequestDTO.js';
import { CreateGroupUseCase } from '../../../core/use-cases/CreateGroupUseCase.js';
import { InviteAthleteToGroupUseCase } from '../../../core/use-cases/InviteAthleteToGroupUseCase.js';
import { RespondGroupInviteUseCase } from '../../../core/use-cases/RespondGroupInviteUseCase.js';
import { ListInvitesUseCase } from '../../../core/use-cases/ListInvitesUseCase.js';
import { SearchAthletesUseCase } from '../../../core/use-cases/SearchAthletesUseCase.js';
import { UploadGroupPhotoUseCase } from '../../../core/use-cases/UploadGroupPhotoUseCase.js';
import { DelegateGroupAdminUseCase } from '../../../core/use-cases/DelegateGroupAdminUseCase.js';
import { RevokeGroupAdminUseCase } from '../../../core/use-cases/RevokeGroupAdminUseCase.js';
import { PrismaGroupRepository } from '../../database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaGroupInviteRepository } from '../../database/prisma/repositories/PrismaGroupInviteRepository.js';
import { PrismaNotificationRepository } from '../../database/prisma/repositories/PrismaNotificationRepository.js';
import { PrismaGroupAdminDelegationRepository } from '../../database/prisma/repositories/PrismaGroupAdminDelegationRepository.js';
import { WhatsAppService } from '../../services/WhatsAppService.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../database/prisma/client.js';

export class GroupController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateGroupRequestDTO.parse(req.body);
      const useCase = new CreateGroupUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
      );
      const result = await useCase.execute({
        adminId: data.adminId,
        name: data.name,
        ...(data.description  !== undefined && { description:  data.description }),
        ...(data.pixKey       !== undefined && { pixKey:       data.pixKey }),
        ...(data.baseLocation !== undefined && { baseLocation: data.baseLocation }),
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async searchAthletes(req: Request, res: Response): Promise<void> {
    try {
      const filters = SearchAthletesRequestDTO.parse(req.query);
      const useCase = new SearchAthletesUseCase(new PrismaAthleteRepository());
      const result = await useCase.execute({
        ...(filters.name  !== undefined && { name:  filters.name }),
        ...(filters.cpf   !== undefined && { cpf:   filters.cpf }),
        ...(filters.email !== undefined && { email: filters.email }),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async inviteAthlete(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const data = InviteAthleteRequestDTO.parse(req.body);
      const useCase = new InviteAthleteToGroupUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaGroupInviteRepository(prisma),
        new PrismaNotificationRepository(prisma),
        new WhatsAppService(),
      );
      const result = await useCase.execute({ groupId, adminId: data.adminId, athleteId: data.athleteId });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async respondInvite(req: Request, res: Response): Promise<void> {
    try {
      const inviteId = req.params['inviteId'] as string;
      const data = RespondInviteRequestDTO.parse(req.body);
      const useCase = new RespondGroupInviteUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaGroupInviteRepository(prisma),
        new PrismaNotificationRepository(prisma),
      );
      const result = await useCase.execute({ inviteId, athleteId: data.athleteId, accept: data.accept });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async listInvites(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const useCase = new ListInvitesUseCase(
        new PrismaGroupInviteRepository(prisma),
        new PrismaGroupRepository(prisma),
      );
      const result = await useCase.execute({ athleteId });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const adminId = req.body['adminId'] as string;
      if (!adminId) { res.status(400).json({ error: 'adminId is required' }); return; }
      if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
      const photoUrl = `/uploads/${req.file.filename}`;
      await new UploadGroupPhotoUseCase(new PrismaGroupRepository(prisma)).execute({ groupId, adminId, photoUrl });
      res.status(200).json({ photoUrl });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delegateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const data = DelegateAdminRequestDTO.parse(req.body);
      const useCase = new DelegateGroupAdminUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
        new PrismaGroupAdminDelegationRepository(prisma),
      );
      const result = await useCase.execute({
        groupId,
        requesterId: data.requesterId,
        delegatedTo: data.delegatedTo,
        isPermanent: data.isPermanent,
        ...(data.matchesLimit !== undefined && { matchesLimit: data.matchesLimit }),
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async revokeAdmin(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const data = RevokeAdminRequestDTO.parse(req.body);
      const useCase = new RevokeGroupAdminUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaGroupAdminDelegationRepository(prisma),
      );
      await useCase.execute({ groupId, requesterId: data.requesterId, delegatedTo: data.delegatedTo });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
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
