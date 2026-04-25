import { Match, MatchStatus } from '../../../../core/domain/entities/Match.js';

interface MatchCreateInput {
  id?: string;
  groupId: string;
  date: Date;
  latitude: number;
  longitude: number;
  minAge: number;
  maxAge: number;
  minOverall: number;
  vacanciesOpen: number;
  status?: MatchStatus;
}

interface PrismaMatch {
  id: string;
  groupId: string;
  date: Date;
  latitude: number;
  longitude: number;
  minAge: number;
  maxAge: number;
  minOverall: number;
  vacanciesOpen: number;
  status: MatchStatus;
}

export class PrismaMatchMapper {
  static toPersistence(match: Match): MatchCreateInput {
    return {
      id: match.id,
      groupId: match.groupId,
      date: match.date,
      latitude: match.latitude,
      longitude: match.longitude,
      minAge: match.minAge,
      maxAge: match.maxAge,
      minOverall: match.minOverall,
      vacanciesOpen: match.vacanciesOpen,
      status: match.status as any,
    };
  }

  static toDomain(raw: any): Match {
    return new Match(
      raw.groupId,
      raw.date,
      raw.latitude,
      raw.longitude,
      raw.vacanciesOpen,
      raw.minOverall,
      raw.minAge,
      raw.maxAge,
      raw.status as MatchStatus,
      raw.id
    );
  }
}