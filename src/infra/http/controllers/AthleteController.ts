import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { CreateAthleteRequestDTO, UpdateLocationRequestDTO } from '../dtos/CreateAthleteRequestDTO.js';
import { RegisterAthleteUseCase } from '../../../core/use-cases/RegisterAthleteUseCase.js';
import { UpdateAthleteLocationUseCase } from '../../../core/use-cases/UpdateAthleteLocationUseCase.js';
import { UploadAthletePhotoUseCase } from '../../../core/use-cases/UploadAthletePhotoUseCase.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaAthleteSocialAccountRepository } from '../../database/prisma/repositories/PrismaAthleteSocialAccountRepository.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../database/prisma/client.js';
import { SaveAvailabilityUseCase } from '../../../core/use-cases/SaveAvailabilityUseCase.js';
import { z } from 'zod';

const SaveAvailabilityDTO = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime:   z.string().regex(/^\d{2}:\d{2}$/),
  })),
});

const UpdateAthleteDTO = z.object({
  name:                z.string().min(1).optional(),
  cpf:                 z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 11, 'CPF must contain exactly 11 digits').optional(),
  gender:              z.enum(['M', 'F']).optional(),
  phone:               z.string().optional(),
  age:                 z.number().int().min(16).max(99).optional(),
  position:            z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']).optional(),
  isGoalkeeperForHire: z.boolean().optional(),
  pixKey:              z.string().optional().nullable(),
  address: z.object({
    cep:          z.string().min(1),
    street:       z.string().min(1),
    number:       z.number().int().positive(),
    complement:   z.string().optional(),
    neighborhood: z.string().min(1),
    city:         z.string().min(1),
    state:        z.string().length(2).toUpperCase(),
  }).optional(),
});

export class AthleteController {
  async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;

      const athlete = await prisma.athlete.findUnique({ where: { id: athleteId } });
      if (!athlete) { res.status(404).json({ error: 'Athlete not found' }); return; }

      // Grupos do atleta (membro ou admin)
      const groups = await prisma.group.findMany({
        where: {
          OR: [
            { memberIds: { has: athleteId } },
            { adminIds:  { has: athleteId } },
          ],
        },
        select: { id: true, adminIds: true },
      });
      const groupIds      = groups.map((g) => g.id);
      const adminGroupIds = groups.filter((g) => g.adminIds.includes(athleteId)).map((g) => g.id);

      // Partidas confirmadas OU qualquer partida de grupo onde o atleta é admin
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { groupId: { in: groupIds }, confirmedIds: { has: athleteId } },
            { groupId: { in: adminGroupIds } },
          ],
        },
        orderBy: { date: 'asc' },
      });

      const formatDate = (d: Date) =>
        d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      const formatTime = (d: Date) =>
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const overall = Math.round(
        (athlete.statsPace + athlete.statsShooting + athlete.statsPassing +
         athlete.statsDribbling + athlete.statsDefense + athlete.statsPhysical) / 6
      );

      res.status(200).json({
        name:               athlete.name,
        cpf:                athlete.cpf,
        gender:             athlete.gender,
        overall,
        position:           athlete.position,
        phone:              athlete.phone,
        age:                athlete.age,
        photoUrl:           athlete.photoUrl ?? null,
        pixKey:             athlete.pixKey ?? null,
        isGoalkeeperForHire:athlete.isGoalkeeperForHire,
        address: {
          cep:          athlete.addressCep,
          street:       athlete.addressStreet,
          number:       athlete.addressNumber,
          complement:   athlete.addressComplement ?? undefined,
          neighborhood: athlete.addressNeighborhood,
          city:         athlete.addressCity,
          state:        athlete.addressState,
        },
        status:        athlete.isInjured ? 'Lesionado' : athlete.financialDebt > 0 ? 'Inadimplente' : 'Ativo',
        isInjured:     athlete.isInjured,
        paymentStatus: athlete.financialDebt > 0 ? 'PENDING' : 'PAID',
        groupIds,
        averageStats: {
          pace:      athlete.statsPace,
          shooting:  athlete.statsShooting,
          passing:   athlete.statsPassing,
          dribbling: athlete.statsDribbling,
          defense:   athlete.statsDefense,
          physical:  athlete.statsPhysical,
          overall,
        },
        confirmedMatches: matches.map((m) => ({
          id:             m.id,
          groupId:        m.groupId,
          type:           m.type,
          date:           formatDate(m.date),
          time:           formatTime(m.date),
          isoDate:        m.date.toISOString(),
          location:       m.location,
          status:         m.status,
          totalSlots:     m.totalVacancies,
          confirmedSlots: m.confirmedIds.length,
          minOverall:     m.minOverall ?? undefined,
        })),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async saveAvailability(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const { slots } = SaveAvailabilityDTO.parse(req.body);
      await new SaveAvailabilityUseCase(new PrismaAthleteRepository()).execute({ athleteId, slots });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const slots = await prisma.availability.findMany({
        where: { athleteId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        select: { dayOfWeek: true, startTime: true, endTime: true },
      });
      res.status(200).json(slots);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const data = UpdateAthleteDTO.parse(req.body);
      await prisma.athlete.update({
        where: { id: athleteId },
        data: {
          ...(data.name                !== undefined && { name: data.name }),
          ...(data.cpf                 !== undefined && { cpf: data.cpf }),
          ...(data.gender              !== undefined && { gender: data.gender }),
          ...(data.phone               !== undefined && { phone: data.phone }),
          ...(data.age                 !== undefined && { age: data.age }),
          ...(data.position            !== undefined && { position: data.position }),
          ...(data.isGoalkeeperForHire !== undefined && { isGoalkeeperForHire: data.isGoalkeeperForHire }),
          ...(data.pixKey              !== undefined && { pixKey: data.pixKey }),
          ...(data.address && {
            addressCep:          data.address.cep,
            addressStreet:       data.address.street,
            addressNumber:       data.address.number,
            addressComplement:   data.address.complement ?? null,
            addressNeighborhood: data.address.neighborhood,
            addressCity:         data.address.city,
            addressState:        data.address.state,
          }),
        },
      });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateAthleteRequestDTO.parse(req.body);
      const useCase = new RegisterAthleteUseCase(
        new PrismaAthleteRepository(),
        new PrismaAthleteSocialAccountRepository(prisma),
      );
      const athlete = await useCase.execute({
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        address: data.address,
        isGoalkeeperForHire: data.isGoalkeeperForHire,
        ...(data.latitude   !== undefined && { latitude:   data.latitude }),
        ...(data.longitude  !== undefined && { longitude:  data.longitude }),
        ...(data.password   !== undefined && { password:   data.password }),
        ...(data.tempToken  !== undefined && { tempToken:  data.tempToken }),
      });
      const { passwordHash: _, ...safeAthlete } = athlete as any;
      res.status(201).json(safeAthlete);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const { latitude, longitude } = UpdateLocationRequestDTO.parse(req.body);
      await new UpdateAthleteLocationUseCase(new PrismaAthleteRepository()).execute({ athleteId, latitude, longitude });
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const photoUrl = `/uploads/${req.file.filename}`;
      await new UploadAthletePhotoUseCase(new PrismaAthleteRepository()).execute({ athleteId, photoUrl });
      res.status(200).json({ photoUrl });
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
      console.error('[AthleteController] Unexpected error:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}
