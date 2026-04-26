import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { LoginUseCase } from '../../../core/use-cases/LoginUseCase.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';

const LoginRequestDTO = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = LoginRequestDTO.parse(req.body);
      const result = await new LoginUseCase(new PrismaAthleteRepository()).execute({ email, password });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })) });
      } else if (error instanceof BusinessRuleViolationError) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
}
