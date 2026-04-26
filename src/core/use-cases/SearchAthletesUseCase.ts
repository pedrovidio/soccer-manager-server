import { IAthleteRepository, AthleteSearchFilters } from '../domain/repositories/IAthleteRepository.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface SearchAthletesInput {
  name?: string;
  cpf?: string;
  email?: string;
}

export interface SearchAthletesOutput {
  id: string;
  name: string;
  email: string;
  position: string;
  overall: number;
}

export class SearchAthletesUseCase {
  constructor(private athleteRepository: IAthleteRepository) {}

  async execute(input: SearchAthletesInput): Promise<SearchAthletesOutput[]> {
    if (!input.name && !input.cpf && !input.email) {
      throw new BusinessRuleViolationError('At least one search filter must be provided');
    }

    const filters: AthleteSearchFilters = {
      ...(input.name  && { name:  input.name }),
      ...(input.cpf   && { cpf:   input.cpf }),
      ...(input.email && { email: input.email }),
    };

    const athletes = await this.athleteRepository.search(filters);

    return athletes.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      position: a.position,
      overall: a.calculateOverall(),
    }));
  }
}
