import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { SubmitAssessmentRequestDTO } from '../dtos/SubmitAssessmentRequestDTO.js';
import { SubmitAssessmentUseCase } from '../../../core/use-cases/SubmitAssessmentUseCase.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaAssessmentRepository } from '../../database/prisma/repositories/PrismaAssessmentRepository.js';
import { EntityNotFoundError } from '../../../core/domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';

export class AssessmentController {
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const { athleteId } = req.params as { athleteId: string };
      const answers = SubmitAssessmentRequestDTO.parse(req.body);

      const useCase = new SubmitAssessmentUseCase(
        new PrismaAthleteRepository(),
        new PrismaAssessmentRepository(),
      );

      await useCase.execute({ athleteId, answers });

      res.status(200).json({ message: 'Assessment submitted successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
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
}
