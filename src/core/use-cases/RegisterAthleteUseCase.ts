import bcrypt from 'bcryptjs';
import { Athlete, Address, Stats, FootballLevel } from '../domain/entities/Athlete.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

const DEFAULT_STATS: Stats = {
  pace: 50, shooting: 50, passing: 50,
  dribbling: 50, defense: 50, physical: 50,
};

const DEFAULT_FOOTBALL_LEVEL: FootballLevel = 'CASUAL';

interface RegisterAthleteInput {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  age: number;
  gender: 'M' | 'F';
  address: Address;
  latitude?: number | undefined;
  longitude?: number | undefined;
  isGoalkeeperForHire?: boolean;
}

export class RegisterAthleteUseCase {
  constructor(private athleteRepository: IAthleteRepository) {}

  async execute(input: RegisterAthleteInput): Promise<Athlete> {
    const existingByCpf = await this.athleteRepository.findByCpf(input.cpf);
    if (existingByCpf) throw new BusinessRuleViolationError('Athlete with this CPF already exists');

    const existingByEmail = await this.athleteRepository.findByEmail(input.email);
    if (existingByEmail) throw new BusinessRuleViolationError('Athlete with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, 10);

    const athlete = new Athlete(
      input.name,
      input.cpf,
      input.email,
      input.phone,
      input.address,
      input.age,
      input.gender,
      'Undefined',
      DEFAULT_STATS,
      DEFAULT_FOOTBALL_LEVEL,
      undefined,
      input.latitude,
      input.longitude,
      input.isGoalkeeperForHire ?? false,
      false,
      0,
      false,
      undefined,
      passwordHash,
    );

    await this.athleteRepository.save(athlete);

    return athlete;
  }
}
