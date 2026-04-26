export interface TeamScore {
  teamName: string;
  goals: number;
}

export interface MatchScoreRecord {
  id: string;
  matchId: string;
  registeredBy: string;
  scores: TeamScore[];
  createdAt: Date;
}

export interface MatchHistoryFilters {
  status?: 'FINISHED' | 'CANCELLED';
  type?: 'CAMPO' | 'SOCIETY' | 'FUTSAL';
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export interface MatchHistoryItem {
  id: string;
  groupId: string;
  type: string;
  date: Date;
  location: string;
  status: string;
  confirmedIds: string[];
  scores: TeamScore[] | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IMatchScoreRepository {
  save(score: MatchScoreRecord): Promise<void>;
  findByMatch(matchId: string): Promise<MatchScoreRecord | null>;
}

export interface IMatchHistoryRepository {
  listByGroup(groupId: string, filters: MatchHistoryFilters): Promise<PaginatedResult<MatchHistoryItem>>;
  listByAthlete(athleteId: string, filters: MatchHistoryFilters): Promise<PaginatedResult<MatchHistoryItem>>;
}
