import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { CreateAthleteRequestDTO } from '../dtos/CreateAthleteRequestDTO.js';
import { RegisterAthleteUseCase } from '../../../core/use-cases/RegisterAthleteUseCase.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';

export class AthleteController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateAthleteRequestDTO.parse(req.body);

      const repository = new PrismaAthleteRepository();
      const useCase = new RegisterAthleteUseCase(repository);

      const athlete = await useCase.execute(validatedData);

      res.status(201).json(athlete);
    } catch (error: any) {
      console.error('[AthleteController] Error:', error);
      
      if (error instanceof ZodError) {
        const formattedErrors = (error.issues || []).map((err: any) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
        }));
        res.status(400).json({ errors: formattedErrors });
      } else if (error instanceof EntityNotFoundError) {
        res.status(404).json({ error: error.message, code: error.code });
      } else if (error instanceof BusinessRuleViolationError) {
        res.status(409).json({ error: error.message, code: error.code });
      } else if (error instanceof DomainError) {
        res.status(400).json({ error: error.message, code: error.code });
      } else if (error?.message) {
        res.status(500).json({ error: 'An unexpected error occurred' });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
}