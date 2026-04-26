import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { CreateAthleteRequestDTO, UpdateLocationRequestDTO } from '../dtos/CreateAthleteRequestDTO.js';
import { RegisterAthleteUseCase } from '../../../core/use-cases/RegisterAthleteUseCase.js';
import { UpdateAthleteLocationUseCase } from '../../../core/use-cases/UpdateAthleteLocationUseCase.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';

export class AthleteController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateAthleteRequestDTO.parse(req.body);
      const athlete = await new RegisterAthleteUseCase(new PrismaAthleteRepository()).execute(data);
      res.status(201).json(athlete);
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
