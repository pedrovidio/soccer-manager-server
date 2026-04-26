import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface UpdateAthleteLocationInput {
  athleteId: string;
  latitude: number;
  longitude: number;
}

export class UpdateAthleteLocationUseCase {
  constructor(private athleteRepository: IAthleteRepository) {}

  async execute(input: UpdateAthleteLocationInput): Promise<void> {
    const { athleteId, latitude, longitude } = input;

    if (latitude < -90 || latitude > 90) {
      throw new BusinessRuleViolationError('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BusinessRuleViolationError('Longitude must be between -180 and 180');
    }

    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);

    await this.athleteRepository.updateLocation(athleteId, latitude, longitude);
  }
}
