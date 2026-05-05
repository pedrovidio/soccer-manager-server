import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  CreateGroupRequestDTO,
  InviteAthleteRequestDTO,
  RespondInviteRequestDTO,
  SearchAthletesRequestDTO,
  DelegateAdminRequestDTO,
  UpdateGroupRequestDTO,
  RevokeAdminRequestDTO,
} from '../dtos/GroupRequestDTO.js';
import { CreateGroupUseCase } from '../../../core/use-cases/CreateGroupUseCase.js';
import { UpdateGroupUseCase } from '../../../core/use-cases/UpdateGroupUseCase.js';
import { InviteAthleteToGroupUseCase } from '../../../core/use-cases/InviteAthleteToGroupUseCase.js';
import { RespondGroupInviteUseCase } from '../../../core/use-cases/RespondGroupInviteUseCase.js';
import { ListInvitesUseCase } from '../../../core/use-cases/ListInvitesUseCase.js';
import { SearchAthletesUseCase } from '../../../core/use-cases/SearchAthletesUseCase.js';
import { UploadGroupPhotoUseCase } from '../../../core/use-cases/UploadGroupPhotoUseCase.js';
import { DelegateGroupAdminUseCase } from '../../../core/use-cases/DelegateGroupAdminUseCase.js';
import { SetMemberBlockedUseCase } from '../../../core/use-cases/SetMemberBlockedUseCase.js';
import { SetMemberInjuredUseCase } from '../../../core/use-cases/SetMemberInjuredUseCase.js';
import { RemoveMemberUseCase } from '../../../core/use-cases/RemoveMemberUseCase.js';
import { RevokeGroupAdminUseCase } from '../../../core/use-cases/RevokeGroupAdminUseCase.js';
import { GetGroupBalanceUseCase } from '../../../core/use-cases/GetGroupBalanceUseCase.js';
import { PrismaGroupRepository } from '../../database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaMatchRepository } from '../../database/prisma/repositories/PrismaMatchRepository.js';
import { PrismaGroupInviteRepository } from '../../database/prisma/repositories/PrismaGroupInviteRepository.js';
import { PrismaNotificationRepository } from '../../database/prisma/repositories/PrismaNotificationRepository.js';
import { PrismaGroupAdminDelegationRepository } from '../../database/prisma/repositories/PrismaGroupAdminDelegationRepository.js';
import { PrismaFinancialRepository } from '../../database/prisma/repositories/PrismaFinancialRepository.js';
import { PrismaMatchInviteRepository } from '../../database/prisma/repositories/PrismaMatchInviteRepository.js';
import { WhatsAppService } from '../../services/WhatsAppService.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../database/prisma/client.js';

export class GroupController {
  async getHome(req: Request, res: Response): Promise<void> {
    try {
      const groupId     = req.params['groupId'] as string;
      const requesterId = req.query['requesterId'] as string;
      if (!requesterId) { res.status(400).json({ error: 'requesterId is required' }); return; }

      const groupRepo    = new PrismaGroupRepository(prisma);
      const athleteRepo  = new PrismaAthleteRepository();
      const matchRepo    = new PrismaMatchRepository(prisma);
      const financialRepo = new PrismaFinancialRepository();

      const group = await groupRepo.findById(groupId);
      if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

      const isAdmin = group.isAdmin(requesterId);

      // Members details — admins + mensalistas deduplicated
      const allMemberIds = [...new Set([...group.adminIds, ...group.memberIds])];
      const athletes = await Promise.all(allMemberIds.map((id) => athleteRepo.findById(id)));
      const blockedMap = await groupRepo.getMemberBlockedStatus(groupId, allMemberIds);
      const members = athletes
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => ({
          id:        a.id,
          name:      a.name,
          position:  a.position,
          overall:   a.calculateOverall(),
          isAdmin:   group.adminIds.includes(a.id),
          isInjured: a.isInjured,
          hasDebt:   a.financialDebt > 0,
          isBlocked: blockedMap[a.id] ?? false,
        }));

      // Upcoming matches (next 5)
      const allMatches = await matchRepo.listByGroup(groupId);
      const now = new Date();
      const upcomingMatches = allMatches
        .filter((m) => m.status === 'SCHEDULED' && m.date > now)
        .slice(0, 5)
        .map((m) => ({
          id:             m.id,
          date:           m.date,
          location:       m.location,
          totalVacancies: m.totalVacancies,
          confirmedCount: m.confirmedIds.length,
          status:         m.status,
        }));

      // Balance (admins only)
      let balance = null;
      if (isAdmin) {
        const transactions = await financialRepo.findByGroupId(groupId);
        const paid    = transactions.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amount, 0);
        const pending = transactions.filter((t) => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0);
        balance = { cashInHand: paid, totalPending: pending };
      }

      res.status(200).json({
        group: {
          id:                    group.id,
          name:                  group.name,
          description:           group.description,
          monthlyFee:            group.monthlyFee,
          pixKey:                group.pixKey,
          goalkeeperPaymentMode: group.goalkeeperPaymentMode,
          status:                group.status,
        },
        isAdmin,
        members,
        upcomingMatches,
        balance,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const repo = new PrismaGroupRepository(prisma);
      const group = await repo.findById(groupId);
      if (!group) { res.status(404).json({ error: 'Group not found' }); return; }
      res.status(200).json({
        id: group.id,
        name: group.name,
        description: group.description,
        adminIds: group.adminIds,
        memberIds: group.memberIds,
        pixKey: group.pixKey,
        monthlyFee: group.monthlyFee,
        goalkeeperPaymentMode: group.goalkeeperPaymentMode,
        status: group.status,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const data = UpdateGroupRequestDTO.parse(req.body);
      await new UpdateGroupUseCase(new PrismaGroupRepository(prisma)).execute({
        groupId,
        requesterId:           data.requesterId,
        ...(data.name                  !== undefined && { name:                  data.name }),
        ...(data.description           !== undefined && { description:           data.description }),
        ...(data.pixKey                !== undefined && { pixKey:                data.pixKey }),
        ...(data.monthlyFee            !== undefined && { monthlyFee:            data.monthlyFee }),
        ...(data.goalkeeperPaymentMode !== undefined && { goalkeeperPaymentMode: data.goalkeeperPaymentMode }),
      });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async listByAthlete(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const repo = new PrismaGroupRepository(prisma);
      const groups = await repo.listByMember(athleteId);
      const adminGroups = await repo.listByAdmin(athleteId);
      // merge deduplicating by id
      const all = [...groups];
      for (const g of adminGroups) {
        if (!all.find((x) => x.id === g.id)) all.push(g);
      }
      res.status(200).json(all.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        adminIds: g.adminIds,
        memberIds: g.memberIds,
        pixKey: g.pixKey,
        monthlyFee: g.monthlyFee,
        goalkeeperPaymentMode: g.goalkeeperPaymentMode,
        status: g.status,
      })));
    } catch (error) {
      this.handleError(error, res);
    }
  }

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
        ...(data.description          !== undefined && { description:          data.description }),
        ...(data.pixKey               !== undefined && { pixKey:               data.pixKey }),
        ...(data.monthlyFee           !== undefined && { monthlyFee:           data.monthlyFee }),
        ...(data.baseLocation         !== undefined && { baseLocation:         data.baseLocation }),
        ...(data.goalkeeperPaymentMode !== undefined && { goalkeeperPaymentMode: data.goalkeeperPaymentMode }),
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async listGroupInvites(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params['groupId'] as string;
      const inviteRepo = new PrismaGroupInviteRepository(prisma);
      const athleteRepo = new PrismaAthleteRepository();
      const invites = await inviteRepo.findByGroup(groupId);
      const active = invites.filter((i) => i.status === 'PENDING' || i.status === 'ACCEPTED');
      const withNames = await Promise.all(
        active.map(async (i) => {
          const athlete = await athleteRepo.findById(i.athleteId);
          return {
            inviteId:  i.id,
            athleteId: i.athleteId,
            name:      athlete?.name ?? 'Unknown',
            position:  athlete?.position ?? 'Undefined',
            overall:   athlete?.calculateOverall() ?? 0,
            email:     athlete?.email ?? '',
            status:    i.status,
            createdAt: i.createdAt,
          };
        })
      );
      res.status(200).json(withNames);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async searchAthletes(req: Request, res: Response): Promise<void> {
    try {
      const filters = SearchAthletesRequestDTO.parse(req.query);
      const useCase = new SearchAthletesUseCase(
        new PrismaAthleteRepository(),
        new PrismaGroupRepository(prisma),
        new PrismaGroupInviteRepository(prisma),
      );
      const result = await useCase.execute({
        ...(filters.name        !== undefined && { name:        filters.name }),
        ...(filters.cpf         !== undefined && { cpf:         filters.cpf }),
        ...(filters.email       !== undefined && { email:       filters.email }),
        ...(filters.groupId     !== undefined && { groupId:     filters.groupId }),
        ...(filters.requesterId !== undefined && { requesterId: filters.requesterId }),
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
        new PrismaMatchInviteRepository(prisma),
        new PrismaMatchRepository(prisma),
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

  async balance(req: Request, res: Response): Promise<void> {
    try {
      const groupId     = req.params['groupId'] as string;
      const requesterId = req.query['requesterId'] as string;
      if (!requesterId) { res.status(400).json({ error: 'requesterId is required' }); return; }

      const from = req.query['from'] ? new Date(req.query['from'] as string) : undefined;
      const to   = req.query['to']   ? new Date(req.query['to']   as string) : undefined;

      const useCase = new GetGroupBalanceUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaFinancialRepository(),
      );
      const result = await useCase.execute({
        groupId,
        requesterId,
        ...(from || to ? { filters: { ...(from && { from }), ...(to && { to }) } } : {}),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async setMemberBlocked(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, athleteId } = req.params as { groupId: string; athleteId: string };
      const { requesterId, isBlocked } = req.body as { requesterId: string; isBlocked: boolean };
      if (!requesterId || isBlocked === undefined) {
        res.status(400).json({ error: 'requesterId and isBlocked are required' }); return;
      }
      await new SetMemberBlockedUseCase(new PrismaGroupRepository(prisma)).execute({
        groupId, requesterId, athleteId, isBlocked,
      });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async setMemberInjured(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, athleteId } = req.params as { groupId: string; athleteId: string };
      const { requesterId, isInjured } = req.body as { requesterId: string; isInjured: boolean };
      if (!requesterId || isInjured === undefined) {
        res.status(400).json({ error: 'requesterId and isInjured are required' }); return;
      }
      await new SetMemberInjuredUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaAthleteRepository(),
      ).execute({ groupId, requesterId, athleteId, isInjured });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, athleteId } = req.params as { groupId: string; athleteId: string };
      const requesterId = req.body['requesterId'] as string;
      if (!requesterId) { res.status(400).json({ error: 'requesterId is required' }); return; }
      await new RemoveMemberUseCase(new PrismaGroupRepository(prisma)).execute({
        groupId, requesterId, athleteId,
      });
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
