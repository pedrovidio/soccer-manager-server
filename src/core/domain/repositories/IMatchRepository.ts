import { Match } from '../entities/Match.js';

export interface IMatchRepository {
  save(match: Match): Promise<void>;
  findById(id: string): Promise<Match | null>;
  listByGroup(groupId: string): Promise<Match[]>;
  findScheduledBefore(date: Date): Promise<Match[]>;
}
