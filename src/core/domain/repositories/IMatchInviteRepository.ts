import { MatchInvite } from '../entities/MatchInvite.js';

export interface IMatchInviteRepository {
  save(invite: MatchInvite): Promise<void>;
  findById(id: string): Promise<MatchInvite | null>;
  findByMatchAndAthlete(matchId: string, athleteId: string): Promise<MatchInvite | null>;
  findPendingByAthlete(athleteId: string): Promise<MatchInvite[]>;
  findByMatch(matchId: string): Promise<MatchInvite[]>;
}
