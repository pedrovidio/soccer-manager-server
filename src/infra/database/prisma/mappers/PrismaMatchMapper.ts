import { Match, MatchStatus, MatchType } from '../../../../core/domain/entities/Match.js';

export class PrismaMatchMapper {
  static toDomain(raw: any): Match {
    return new Match(
      raw.groupId,
      raw.type as MatchType,
      raw.date,
      raw.location,
      raw.latitude,
      raw.longitude,
      raw.totalVacancies,
      raw.reserveVacancies,
      raw.spotRadiusKm,
      raw.minOverall,
      raw.minAge,
      raw.maxAge,
      raw.confirmedIds ?? [],
      raw.checkedInIds ?? [],
      raw.status as MatchStatus,
      raw.id,
    );
  }

  static toPrisma(match: Match) {
    return {
      id:               match.id,
      groupId:          match.groupId,
      type:             match.type,
      date:             match.date,
      location:         match.location,
      latitude:         match.latitude,
      longitude:        match.longitude,
      totalVacancies:   match.totalVacancies,
      reserveVacancies: match.reserveVacancies,
      spotRadiusKm:     match.spotRadiusKm,
      minOverall:       match.minOverall,
      minAge:           match.minAge,
      maxAge:           match.maxAge,
      confirmedIds:     match.confirmedIds,
      checkedInIds:     match.checkedInIds,
      status:           match.status,
    };
  }
}
