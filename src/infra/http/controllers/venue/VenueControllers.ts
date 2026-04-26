import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import {
  SetupSuperAdminUseCase,
  LoginSuperAdminUseCase,
  UpdateCommissionRateUseCase,
  UpdateSuperAdminPaymentInfoUseCase,
} from '../../../../core/use-cases/venue/SuperAdminUseCases.js';
import {
  RegisterVenueOwnerUseCase,
  LoginVenueOwnerUseCase,
  ReviewVenueOwnerUseCase,
  ListPendingVenueOwnersUseCase,
} from '../../../../core/use-cases/venue/VenueOwnerUseCases.js';
import {
  CreateVenueUseCase,
  CreateCourtUseCase,
  AddCourtAvailabilityUseCase,
  ListAvailableCourtsUseCase,
  ListVenueMatchHistoryUseCase,
} from '../../../../core/use-cases/venue/VenueUseCases.js';
import { ChargeVenueRentalUseCase } from '../../../../core/use-cases/venue/ChargeVenueRentalUseCase.js';
import {
  PrismaSuperAdminRepository,
  PrismaVenueOwnerRepository,
  PrismaVenueRepository,
  PrismaCourtRepository,
  PrismaCourtAvailabilityRepository,
  PrismaMatchVenueRecordRepository,
} from '../../../database/prisma/repositories/venue/PrismaVenueRepositories.js';
import { PrismaAthleteRepository } from '../../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaMatchInviteRepository } from '../../../database/prisma/repositories/PrismaMatchInviteRepository.js';
import { PrismaNotificationRepository } from '../../../database/prisma/repositories/PrismaNotificationRepository.js';
import { PrismaGroupRepository } from '../../../database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaMatchRepository } from '../../../database/prisma/repositories/PrismaMatchRepository.js';
import { DomainError } from '../../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../../database/prisma/client.js';

// ─── DTOs ────────────────────────────────────────────────────────────────────
const SetupDTO         = z.object({ email: z.string().email(), password: z.string().min(8), setupKey: z.string() });
const LoginDTO         = z.object({ email: z.string().email(), password: z.string().min(1) });
const CommissionDTO    = z.object({ rate: z.number().min(0).max(1) });
const PaymentInfoDTO   = z.object({ pixKey: z.string().optional(), asaasWalletId: z.string().optional() });
const RegisterOwnerDTO = z.object({
  name: z.string().min(2), email: z.string().email(), phone: z.string().min(10),
  cpfCnpj: z.string().min(11), password: z.string().min(6),
  pixKey: z.string().optional(), asaasWalletId: z.string().optional(),
});
const CreateVenueDTO   = z.object({ name: z.string().min(2), address: z.string().min(5), latitude: z.number(), longitude: z.number() });
const CreateCourtDTO   = z.object({
  venueId: z.string().uuid(), name: z.string().min(1),
  type: z.enum(['CAMPO', 'SOCIETY', 'FUTSAL']),
  isCovered: z.boolean(), rentalPrice: z.number().positive(),
});
const AvailabilityDTO  = z.object({
  courtId: z.string().uuid(), date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  inviteSpotAthletes: z.boolean().default(false),
  totalVacancies: z.number().int().min(2),
  spotRadiusKm: z.number().positive().optional(),
  minOverall: z.number().int().min(0).max(100).optional(),
  minAge: z.number().int().min(16).optional(),
  maxAge: z.number().int().max(99).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function repos() {
  return {
    superAdmin:   new PrismaSuperAdminRepository(prisma),
    venueOwner:   new PrismaVenueOwnerRepository(prisma),
    venue:        new PrismaVenueRepository(prisma),
    court:        new PrismaCourtRepository(prisma),
    availability: new PrismaCourtAvailabilityRepository(prisma),
    venueRecord:  new PrismaMatchVenueRecordRepository(prisma),
    athlete:      new PrismaAthleteRepository(),
    matchInvite:  new PrismaMatchInviteRepository(prisma),
    notification: new PrismaNotificationRepository(prisma),
    group:        new PrismaGroupRepository(prisma),
    match:        new PrismaMatchRepository(prisma),
  };
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof ZodError) {
    res.status(400).json({ errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })) });
  } else if (error instanceof EntityNotFoundError) {
    res.status(404).json({ error: (error as EntityNotFoundError).message, code: (error as EntityNotFoundError).code });
  } else if (error instanceof BusinessRuleViolationError) {
    res.status(409).json({ error: (error as BusinessRuleViolationError).message, code: (error as BusinessRuleViolationError).code });
  } else if (error instanceof DomainError) {
    res.status(400).json({ error: (error as DomainError).message, code: (error as DomainError).code });
  } else {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// ─── SuperAdmin Controller ────────────────────────────────────────────────────
export class SuperAdminController {
  async setup(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, setupKey } = SetupDTO.parse(req.body);
      if (setupKey !== process.env['SUPER_ADMIN_SETUP_KEY']) { res.status(403).json({ error: 'Invalid setup key' }); return; }
      await new SetupSuperAdminUseCase(repos().superAdmin).execute(email, password);
      res.status(201).json({ success: true });
    } catch (e) { handleError(e, res); }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = LoginDTO.parse(req.body);
      const result = await new LoginSuperAdminUseCase(repos().superAdmin).execute(email, password);
      res.status(200).json(result);
    } catch (e) { handleError(e, res); }
  }

  async updateCommission(req: Request, res: Response): Promise<void> {
    try {
      const { rate } = CommissionDTO.parse(req.body);
      await new UpdateCommissionRateUseCase(repos().superAdmin).execute(rate);
      res.status(200).json({ success: true });
    } catch (e) { handleError(e, res); }
  }

  async updatePaymentInfo(req: Request, res: Response): Promise<void> {
    try {
      const data = PaymentInfoDTO.parse(req.body);
      await new UpdateSuperAdminPaymentInfoUseCase(repos().superAdmin).execute({
        ...(data.pixKey        !== undefined && { pixKey:        data.pixKey }),
        ...(data.asaasWalletId !== undefined && { asaasWalletId: data.asaasWalletId }),
      });
      res.status(200).json({ success: true });
    } catch (e) { handleError(e, res); }
  }

  async listPendingOwners(req: Request, res: Response): Promise<void> {
    try {
      const result = await new ListPendingVenueOwnersUseCase(repos().venueOwner).execute();
      res.status(200).json(result.map((o) => ({ id: o.id, name: o.name, email: o.email, phone: o.phone, cpfCnpj: o.cpfCnpj, createdAt: o.createdAt })));
    } catch (e) { handleError(e, res); }
  }

  async reviewOwner(req: Request, res: Response): Promise<void> {
    try {
      const venueOwnerId = req.params['venueOwnerId'] as string;
      const action = req.params['action'] as 'approve' | 'reject';
      if (!['approve', 'reject'].includes(action)) { res.status(400).json({ error: 'Invalid action' }); return; }
      const r = repos();
      await new ReviewVenueOwnerUseCase(r.venueOwner, r.superAdmin).execute(venueOwnerId, action);
      res.status(200).json({ success: true });
    } catch (e) { handleError(e, res); }
  }
}

// ─── VenueOwner Controller ────────────────────────────────────────────────────
export class VenueOwnerController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = RegisterOwnerDTO.parse(req.body);
      const result = await new RegisterVenueOwnerUseCase(repos().venueOwner).execute({
        name:     data.name,
        email:    data.email,
        phone:    data.phone,
        cpfCnpj:  data.cpfCnpj,
        password: data.password,
        ...(data.pixKey        !== undefined && { pixKey:        data.pixKey }),
        ...(data.asaasWalletId !== undefined && { asaasWalletId: data.asaasWalletId }),
      });
      res.status(201).json(result);
    } catch (e) { handleError(e, res); }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = LoginDTO.parse(req.body);
      const result = await new LoginVenueOwnerUseCase(repos().venueOwner).execute(email, password);
      res.status(200).json(result);
    } catch (e) { handleError(e, res); }
  }

  async createVenue(req: Request, res: Response): Promise<void> {
    try {
      const venueOwnerId = req.auth!.sub;
      const data = CreateVenueDTO.parse(req.body);
      const r = repos();
      const venue = await new CreateVenueUseCase(r.venueOwner, r.venue).execute({ venueOwnerId, ...data });
      res.status(201).json(venue);
    } catch (e) { handleError(e, res); }
  }

  async createCourt(req: Request, res: Response): Promise<void> {
    try {
      const venueOwnerId = req.auth!.sub;
      const data = CreateCourtDTO.parse(req.body);
      const r = repos();
      const court = await new CreateCourtUseCase(r.venueOwner, r.venue, r.court).execute({ venueOwnerId, ...data });
      res.status(201).json(court);
    } catch (e) { handleError(e, res); }
  }

  async addAvailability(req: Request, res: Response): Promise<void> {
    try {
      const venueOwnerId = req.auth!.sub;
      const data = AvailabilityDTO.parse(req.body);
      const r = repos();
      const result = await new AddCourtAvailabilityUseCase(
        r.venueOwner, r.venue, r.court, r.availability,
        r.athlete, r.matchInvite, r.notification, r.group, r.match, r.venueRecord, r.superAdmin,
      ).execute({
        venueOwnerId:       venueOwnerId,
        courtId:            data.courtId,
        date:               data.date,
        startTime:          data.startTime,
        endTime:            data.endTime,
        inviteSpotAthletes: data.inviteSpotAthletes,
        totalVacancies:     data.totalVacancies,
        ...(data.spotRadiusKm !== undefined && { spotRadiusKm: data.spotRadiusKm }),
        ...(data.minOverall   !== undefined && { minOverall:   data.minOverall }),
        ...(data.minAge       !== undefined && { minAge:       data.minAge }),
        ...(data.maxAge       !== undefined && { maxAge:       data.maxAge }),
      });
      res.status(201).json(result);
    } catch (e) { handleError(e, res); }
  }

  async listMatchHistory(req: Request, res: Response): Promise<void> {
    try {
      const venueOwnerId = req.auth!.sub;
      const result = await new ListVenueMatchHistoryUseCase(repos().venueRecord).execute(venueOwnerId);
      res.status(200).json(result);
    } catch (e) { handleError(e, res); }
  }

  async chargeRental(req: Request, res: Response): Promise<void> {
    try {
      const matchId = req.params['matchId'] as string;
      const r = repos();
      const result = await new ChargeVenueRentalUseCase(r.match, r.athlete, r.venueRecord, r.venueOwner, r.superAdmin).execute(matchId);
      res.status(200).json(result);
    } catch (e) { handleError(e, res); }
  }
}

// ─── Public Courts Controller (for group admins) ──────────────────────────────
export class CourtsController {
  async listAvailable(req: Request, res: Response): Promise<void> {
    try {
      const date = z.coerce.date().parse(req.query['date']);
      const type = req.query['type'] as any;
      const result = await new ListAvailableCourtsUseCase(repos().court).execute(date, type);
      res.status(200).json(result);
    } catch (e) { handleError(e, res); }
  }
}
