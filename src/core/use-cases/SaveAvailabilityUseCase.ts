import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { prisma } from '../../infra/database/prisma/client.js';

export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Dom … 6=Sáb
  startTime: string; // 'HH:MM'
  endTime:   string; // 'HH:MM'
}

export interface SaveAvailabilityInput {
  athleteId: string;
  slots: AvailabilitySlot[];
}

export class SaveAvailabilityUseCase {
  constructor(private athleteRepository: IAthleteRepository) {}

  async execute(input: SaveAvailabilityInput): Promise<void> {
    const athlete = await this.athleteRepository.findById(input.athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', input.athleteId);

    // Substitui todas as disponibilidades existentes
    await prisma.availability.deleteMany({ where: { athleteId: input.athleteId } });

    if (input.slots.length > 0) {
      await prisma.availability.createMany({
        data: input.slots.map((s) => ({
          athleteId: input.athleteId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime:   s.endTime,
        })),
      });
    }
  }
}
