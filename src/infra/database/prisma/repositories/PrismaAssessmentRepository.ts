import { AssessmentAnswer } from '../../../../core/domain/entities/AssessmentAnswer.js';
import { IAssessmentRepository } from '../../../../core/domain/repositories/IAssessmentRepository.js';
import { PrismaAssessmentMapper } from '../mappers/PrismaAssessmentMapper.js';
import { prisma } from '../client.js';

export class PrismaAssessmentRepository implements IAssessmentRepository {
  async save(assessment: AssessmentAnswer): Promise<void> {
    const data = PrismaAssessmentMapper.toPersistence(assessment);
    await prisma.assessment.upsert({
      where:  { athleteId: assessment.athleteId },
      update: data,
      create: data,
    });
  }

  async findByAthleteId(athleteId: string): Promise<AssessmentAnswer | null> {
    const raw = await prisma.assessment.findUnique({ where: { athleteId } });
    return raw ? PrismaAssessmentMapper.toDomain(raw as any) : null;
  }
}
