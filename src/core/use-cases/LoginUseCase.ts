import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  email: string;
  password: string;
}

interface Output {
  token: string;
  athleteId: string;
  name: string;
}

export class LoginUseCase {
  constructor(private athleteRepository: IAthleteRepository) {}

  async execute({ email, password }: Input): Promise<Output> {
    const athlete = await this.athleteRepository.findByEmail(email);
    if (!athlete) throw new BusinessRuleViolationError('Invalid credentials');

    const valid = await bcrypt.compare(password, athlete.passwordHash);
    if (!valid) throw new BusinessRuleViolationError('Invalid credentials');

    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const token = jwt.sign(
      { sub: athlete.id, name: athlete.name },
      secret,
      { expiresIn: '7d' },
    );

    return { token, athleteId: athlete.id, name: athlete.name };
  }
}
