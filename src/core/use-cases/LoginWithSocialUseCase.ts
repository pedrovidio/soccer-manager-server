import jwt from 'jsonwebtoken';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IAthleteSocialAccountRepository } from '../domain/repositories/IAthleteSocialAccountRepository.js';
import { SocialProfile } from '../../infra/services/SocialAuthService.js';

interface Output {
  token: string;
  type: 'authenticated' | 'registration_required';
  athleteId?: string;
  name?: string;
  socialEmail: string;
  socialName: string;
}

export class LoginWithSocialUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private socialAccountRepository: IAthleteSocialAccountRepository,
  ) {}

  async execute(profile: SocialProfile): Promise<Output> {
    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET is not configured');

    // Check if social account is already linked
    const linked = await this.socialAccountRepository.findByProvider(profile.provider, profile.providerId);

    if (linked) {
      const athlete = await this.athleteRepository.findById(linked.athleteId);
      if (athlete) {
        const token = jwt.sign({ sub: athlete.id, name: athlete.name, type: 'auth' }, secret, { expiresIn: '7d' });
        return { token, type: 'authenticated', athleteId: athlete.id, name: athlete.name, socialEmail: profile.email, socialName: profile.name };
      }
    }

    // Check if athlete exists with same email (link accounts)
    const existingByEmail = await this.athleteRepository.findByEmail(profile.email);
    if (existingByEmail) {
      await this.socialAccountRepository.save(existingByEmail.id, profile.provider, profile.providerId);
      const token = jwt.sign({ sub: existingByEmail.id, name: existingByEmail.name, type: 'auth' }, secret, { expiresIn: '7d' });
      return { token, type: 'authenticated', athleteId: existingByEmail.id, name: existingByEmail.name, socialEmail: profile.email, socialName: profile.name };
    }

    // New user — issue temp token for registration flow
    const tempToken = jwt.sign(
      { provider: profile.provider, providerId: profile.providerId, email: profile.email, name: profile.name, type: 'temp' },
      secret,
      { expiresIn: '15m' },
    );

    return { token: tempToken, type: 'registration_required', socialEmail: profile.email, socialName: profile.name };
  }
}
