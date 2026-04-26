import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';

interface Input {
  athleteId: string;
  photoUrl: string;
}

export class UploadAthletePhotoUseCase {
  constructor(private readonly athleteRepository: IAthleteRepository) {}

  async execute({ athleteId, photoUrl }: Input): Promise<void> {
    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);

    athlete.updatePhoto(photoUrl);
    await this.athleteRepository.save(athlete);
  }
}
