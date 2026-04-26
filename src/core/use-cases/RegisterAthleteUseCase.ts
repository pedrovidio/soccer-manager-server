import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Athlete, Address, Stats, FootballLevel } from '../domain/entities/Athlete.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IAthleteSocialAccountRepository } from '../domain/repositories/IAthleteSocialAccountRepository.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

const DEFAULT_STATS: Stats = {
  pace: 50, shooting: 50, passing: 50,
  dribbling: 50, defense: 50, physical: 50,
};

interface TempTokenPayload {
  type: string;
  provider: string;
  providerId: string;
  email: string;
}

interface RegisterAthleteInput {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  age: number;
  gender: 'M' | 'F';
  address: Address;
  latitude?: number;
  longitude?: number;
  isGoalkeeperForHire?: boolean;
  password?: string;
  tempToken?: string;
}

export class RegisterAthleteUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private socialAccountRepository?: IAthleteSocialAccountRepository,
  ) {}

  async execute(input: RegisterAthleteInput): Promise<Athlete> {
    const existingByCpf = await this.athleteRepository.findByCpf(input.cpf);
    if (existingByCpf) throw new BusinessRuleViolationError('Athlete with this CPF already exists');

    const existingByEmail = await this.athleteRepository.findByEmail(input.email);
    if (existingByEmail) throw new BusinessRuleViolationError('Athlete with this email already exists');

    if (!input.password && !input.tempToken) {
      throw new BusinessRuleViolationError('Either password or tempToken must be provided');
    }

    let socialLink: { provider: string; providerId: string } | undefined;

    if (input.tempToken) {
      const secret = process.env['JWT_SECRET'];
      if (!secret) throw new Error('JWT_SECRET is not configured');
      const payload = jwt.verify(input.tempToken, secret) as TempTokenPayload;
      if (payload.type !== 'temp') throw new BusinessRuleViolationError('Invalid registration token');
      socialLink = { provider: payload.provider, providerId: payload.providerId };
    }

    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;

    const athlete = new Athlete(
      input.name, input.cpf, input.email, input.phone, input.address,
      input.age, input.gender, 'Undefined', DEFAULT_STATS, 'CASUAL',
      undefined, input.latitude, input.longitude,
      input.isGoalkeeperForHire ?? false,
      false, 0, false, undefined, passwordHash,
    );

    await this.athleteRepository.save(athlete);

    if (socialLink && this.socialAccountRepository) {
      await this.socialAccountRepository.save(athlete.id, socialLink.provider, socialLink.providerId);
    }

    return athlete;
  }
}
