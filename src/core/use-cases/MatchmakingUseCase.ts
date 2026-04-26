import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';
import { Athlete } from '../domain/entities/Athlete.js';

export interface MatchmakingInput {
  matchId: string;
  teamsCount?: number; // default 2
}

export interface TeamOutput {
  teamNumber: number;
  athletes: { id: string; name: string; position: string; overall: number }[];
  averageOverall: number;
}

export interface MatchmakingOutput {
  teams: TeamOutput[];
  overallDifference: number;
}

export class MatchmakingUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private athleteRepository: IAthleteRepository,
  ) {}

  async execute(input: MatchmakingInput): Promise<MatchmakingOutput> {
    const teamsCount = input.teamsCount ?? 2;

    const match = await this.matchRepository.findById(input.matchId);
    if (!match) throw new EntityNotFoundError('Match', input.matchId);

    if (match.confirmedIds.length < teamsCount) {
      throw new BusinessRuleViolationError('Not enough confirmed athletes to form teams');
    }

    const athletes = (
      await Promise.all(match.confirmedIds.map((id) => this.athleteRepository.findById(id)))
    ).filter((a): a is Athlete => a !== null);

    // Sort descending by weighted overall — best players distributed first (snake draft)
    const sorted = [...athletes].sort((a, b) => b.calculateWeightedOverall() - a.calculateWeightedOverall());

    const teams: Athlete[][] = Array.from({ length: teamsCount }, () => []);

    // Snake draft: 0,1,1,0,0,1... ensures balanced distribution
    sorted.forEach((athlete, idx) => {
      const round      = Math.floor(idx / teamsCount);
      const posInRound = idx % teamsCount;
      const teamIdx    = round % 2 === 0 ? posInRound : teamsCount - 1 - posInRound;
      teams[teamIdx]!.push(athlete);
    });

    const teamOutputs: TeamOutput[] = teams.map((team, i) => {
      const overalls = team.map((a) => a.calculateWeightedOverall());
      const avg      = overalls.length > 0 ? Math.round(overalls.reduce((s, v) => s + v, 0) / overalls.length) : 0;
      return {
        teamNumber: i + 1,
        athletes: team.map((a) => ({ id: a.id, name: a.name, position: a.position, overall: a.calculateWeightedOverall() })),
        averageOverall: avg,
      };
    });

    const overalls         = teamOutputs.map((t) => t.averageOverall);
    const overallDifference = Math.max(...overalls) - Math.min(...overalls);

    return { teams: teamOutputs, overallDifference };
  }
}
