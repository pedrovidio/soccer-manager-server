import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { CheckAthleteDebtStatusUseCase } from './CheckAthleteDebtStatusUseCase.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';

export interface OpenMatchVacanciesInput {
  matchId: string;
  radiusInKm: number;
}

export interface AthleteRecruitmentData {
  id: string;
  name: string;
  distanceInKm?: number;
}

export class OpenMatchVacanciesUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private matchRepository: IMatchRepository,
    private checkDebtUseCase: CheckAthleteDebtStatusUseCase
  ) {}

  async execute(input: OpenMatchVacanciesInput): Promise<AthleteRecruitmentData[]> {
    // 1. Buscar a partida (Fail Fast)
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      throw new EntityNotFoundError('Match', input.matchId);
    }

    // 2. Extrair critérios da partida
    const filters = {
      latitude: match.latitude,
      longitude: match.longitude,
      radiusInKm: input.radiusInKm,
      minOverall: match.minOverall,
      minAge: match.minAge,
      maxAge: match.maxAge,
    };

    // 3. Buscar atletas próximos com critérios
    const nearbyAthletes = await this.athleteRepository.findNearby(filters);

    // 4. Filtrar por inadimplência
    const availableAthletes = [];
    for (const athlete of nearbyAthletes) {
      const hasDebt = await this.checkDebtUseCase.execute(athlete.id);
      if (!hasDebt) {
        availableAthletes.push(athlete);
      }
    }

    // 5. Retornar dados básicos para notificação
    return availableAthletes.map(athlete => ({
      id: athlete.id,
      name: athlete.name,
      distanceInKm: this.calculateDistance(
        match.latitude,
        match.longitude,
        athlete.latitude || 0,
        athlete.longitude || 0
      ),
    }));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula para calcular distância entre dois pontos geográficos
    const R = 6371; // Raio da Terra em quilômetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Arredonda para 1 casa decimal
  }
}