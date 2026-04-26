import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { LoginUseCase } from '../../../core/use-cases/LoginUseCase.js';
import { LoginWithSocialUseCase } from '../../../core/use-cases/LoginWithSocialUseCase.js';
import { SocialAuthService } from '../../services/SocialAuthService.js';
import { PrismaAthleteRepository } from '../../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaAthleteSocialAccountRepository } from '../../database/prisma/repositories/PrismaAthleteSocialAccountRepository.js';
import { BusinessRuleViolationError } from '../../../core/domain/errors/BusinessRuleViolationError.js';
import { prisma } from '../../database/prisma/client.js';

const LoginRequestDTO = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const SocialLoginRequestDTO = z.object({
  provider: z.enum(['google', 'facebook']),
  token: z.string().min(1),
});

export class AuthController {
  private socialAuthService = new SocialAuthService();

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = LoginRequestDTO.parse(req.body);
      const result = await new LoginUseCase(new PrismaAthleteRepository()).execute({ email, password });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async socialLogin(req: Request, res: Response): Promise<void> {
    try {
      const { provider, token } = SocialLoginRequestDTO.parse(req.body);

      const profile = provider === 'google'
        ? await this.socialAuthService.verifyGoogle(token)
        : await this.socialAuthService.verifyFacebook(token);

      const useCase = new LoginWithSocialUseCase(
        new PrismaAthleteRepository(),
        new PrismaAthleteSocialAccountRepository(prisma),
      );

      const result = await useCase.execute(profile);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })) });
    } else if (error instanceof BusinessRuleViolationError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof Error && error.message.includes('not configured')) {
      res.status(500).json({ error: 'Server misconfiguration' });
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}
