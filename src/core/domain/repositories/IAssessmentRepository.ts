import { AssessmentAnswer } from '../entities/AssessmentAnswer.js';

export interface IAssessmentRepository {
  save(assessment: AssessmentAnswer): Promise<void>;
  findByAthleteId(athleteId: string): Promise<AssessmentAnswer | null>;
}
