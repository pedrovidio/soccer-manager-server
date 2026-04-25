import { Athlete, Address, Stats } from '../domain/entities/Athlete.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface RegisterAthleteInput {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  posicao: string;
  idade: number;
  sexo: 'M' | 'F';
  address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | undefined;
    bairro: string;
    cidade: string;
    uf: string;
  };
  stats: {
    velocidade: number;
    resistencia: number;
    forca: number;
    passe: number;
    chute: number;
    defesa: number;
    drible: number;
  };
  latitude?: number | undefined;
  longitude?: number | undefined;
  isGoalkeeperForHire?: boolean | undefined;
  pixKey?: string | undefined;
}

export class RegisterAthleteUseCase {
  constructor(private athleteRepository: IAthleteRepository) {}

  async execute(input: RegisterAthleteInput): Promise<Athlete> {
    const existingByCpf = await this.athleteRepository.findByCpf(input.cpf);
    if (existingByCpf) {
      throw new BusinessRuleViolationError('Athlete with this CPF already exists');
    }

    const existingByEmail = await this.athleteRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new BusinessRuleViolationError('Athlete with this email already exists');
    }

    const athlete = new Athlete(
      input.nome,
      input.cpf,
      input.email,
      input.telefone,
      input.address as Address,
      input.idade,
      input.sexo,
      input.posicao,
      input.stats as Stats,
      undefined, // id
      input.latitude,
      input.longitude,
      input.isGoalkeeperForHire ?? false,
      input.pixKey
    );

    await this.athleteRepository.save(athlete);

    return athlete;
  }
}