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

export class AthleteController {
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
