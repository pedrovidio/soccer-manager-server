import { Match } from '../entities/Match.js';

export interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
  listByGroup(groupId: string): Promise<Match[]>;
  save(match: Match): Promise<void>;
  findAvailableForRecruitment(filters: {
    latitude: number;
    longitude: number;
    radius: number;
  }): Promise<Match[]>;
}