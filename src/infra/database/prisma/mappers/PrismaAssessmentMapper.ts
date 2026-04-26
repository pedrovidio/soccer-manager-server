import { AssessmentAnswer, AssessmentAnswers } from '../../../../core/domain/entities/AssessmentAnswer.js';
import { YearsPlaying, WeeklyFrequency } from '@prisma/client';

interface PrismaAssessment {
  id: string;
  athleteId: string;
  playedProfessionally: boolean;
  highestLevel: string;
  yearsPlaying: YearsPlaying;
  weeklyFrequency: WeeklyFrequency;
  selfRatedPace: number;
  selfRatedShooting: number;
  selfRatedPassing: number;
  selfRatedDribbling: number;
  selfRatedDefense: number;
  selfRatedPhysical: number;
  preferredPosition: string;
  submittedAt: Date;
}

const YEARS_TO_DOMAIN: Record<YearsPlaying, AssessmentAnswers['yearsPlaying']> = {
  LESS_THAN_2:  'LESS_THAN_2',
  TWO_TO_5:     '2_TO_5',
  SIX_TO_10:    '6_TO_10',
  MORE_THAN_10: 'MORE_THAN_10',
};

const YEARS_TO_PRISMA: Record<AssessmentAnswers['yearsPlaying'], YearsPlaying> = {
  LESS_THAN_2:  'LESS_THAN_2',
  '2_TO_5':     'TWO_TO_5',
  '6_TO_10':    'SIX_TO_10',
  MORE_THAN_10: 'MORE_THAN_10',
};

const FREQ_TO_DOMAIN: Record<WeeklyFrequency, AssessmentAnswers['weeklyFrequency']> = {
  RARELY:        'RARELY',
  ONE_TO_2:      '1_TO_2',
  THREE_OR_MORE: '3_OR_MORE',
};

const FREQ_TO_PRISMA: Record<AssessmentAnswers['weeklyFrequency'], WeeklyFrequency> = {
  RARELY:      'RARELY',
  '1_TO_2':    'ONE_TO_2',
  '3_OR_MORE': 'THREE_OR_MORE',
};

export class PrismaAssessmentMapper {
  static toDomain(raw: PrismaAssessment): AssessmentAnswer {
    const answers: AssessmentAnswers = {
      playedProfessionally: raw.playedProfessionally,
      highestLevel:         raw.highestLevel as AssessmentAnswers['highestLevel'],
      yearsPlaying:         YEARS_TO_DOMAIN[raw.yearsPlaying],
      weeklyFrequency:      FREQ_TO_DOMAIN[raw.weeklyFrequency],
      selfRatedPace:        raw.selfRatedPace,
      selfRatedShooting:    raw.selfRatedShooting,
      selfRatedPassing:     raw.selfRatedPassing,
      selfRatedDribbling:   raw.selfRatedDribbling,
      selfRatedDefense:     raw.selfRatedDefense,
      selfRatedPhysical:    raw.selfRatedPhysical,
      preferredPosition:    raw.preferredPosition,
    };
    return new AssessmentAnswer(raw.athleteId, answers, raw.submittedAt);
  }

  static toPersistence(assessment: AssessmentAnswer) {
    return {
      athleteId:            assessment.athleteId,
      playedProfessionally: assessment.answers.playedProfessionally,
      highestLevel:         assessment.answers.highestLevel,
      yearsPlaying:         YEARS_TO_PRISMA[assessment.answers.yearsPlaying],
      weeklyFrequency:      FREQ_TO_PRISMA[assessment.answers.weeklyFrequency],
      selfRatedPace:        assessment.answers.selfRatedPace,
      selfRatedShooting:    assessment.answers.selfRatedShooting,
      selfRatedPassing:     assessment.answers.selfRatedPassing,
      selfRatedDribbling:   assessment.answers.selfRatedDribbling,
      selfRatedDefense:     assessment.answers.selfRatedDefense,
      selfRatedPhysical:    assessment.answers.selfRatedPhysical,
      preferredPosition:    assessment.answers.preferredPosition,
      submittedAt:          assessment.submittedAt,
    };
  }
}
