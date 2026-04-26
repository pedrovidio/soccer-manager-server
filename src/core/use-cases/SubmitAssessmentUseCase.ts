import { AssessmentAnswer, AssessmentAnswers } from '../domain/entities/AssessmentAnswer.js';
import { Stats } from '../domain/entities/Athlete.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IAssessmentRepository } from '../domain/repositories/IAssessmentRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';

export interface SubmitAssessmentInput {
  athleteId: string;
  answers: AssessmentAnswers;
}

export class SubmitAssessmentUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(input: SubmitAssessmentInput): Promise<void> {
    const athlete = await this.athleteRepository.findById(input.athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', input.athleteId);

    const assessment = new AssessmentAnswer(input.athleteId, input.answers);

    const stats: Stats = {
      pace:      input.answers.selfRatedPace,
      shooting:  input.answers.selfRatedShooting,
      passing:   input.answers.selfRatedPassing,
      dribbling: input.answers.selfRatedDribbling,
      defense:   input.answers.selfRatedDefense,
      physical:  input.answers.selfRatedPhysical,
    };

    athlete.completeAssessment(
      assessment.deriveFootballLevel(),
      input.answers.preferredPosition,
      stats,
    );

    await this.assessmentRepository.save(assessment);
    await this.athleteRepository.save(athlete);
  }
}
