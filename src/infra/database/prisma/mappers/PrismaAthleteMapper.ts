import { Athlete, Address, Stats, FootballLevel } from '../../../../core/domain/entities/Athlete.js';

interface PrismaAthlete {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string | null;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  age: number;
  gender: string;
  position: string;
  footballLevel: string;
  statsPace: number;
  statsShooting: number;
  statsPassing: number;
  statsDribbling: number;
  statsDefense: number;
  statsPhysical: number;
  latitude: number | null;
  longitude: number | null;
  isGoalkeeperForHire: boolean;
  isInjured: boolean;
  financialDebt: number;
  hasCompletedAssessment: boolean;
  pixKey: string | null;
  photoUrl: string | null;
  passwordHash: string | null;
}

export class PrismaAthleteMapper {
  static toPersistence(athlete: Athlete): Omit<PrismaAthlete, 'pixKey'> & { pixKey: string | null } {
    const stats = athlete.getStats();
    return {
      id: athlete.id,
      name: athlete.name,
      cpf: athlete.cpf,
      email: athlete.email,
      phone: athlete.phone,
      addressCep: athlete.address.cep,
      addressStreet: athlete.address.street,
      addressNumber: athlete.address.number,
      addressComplement: athlete.address.complement ?? null,
      addressNeighborhood: athlete.address.neighborhood,
      addressCity: athlete.address.city,
      addressState: athlete.address.state,
      age: athlete.age,
      gender: athlete.gender,
      position: athlete.position,
      footballLevel: athlete.footballLevel,
      statsPace: stats.pace,
      statsShooting: stats.shooting,
      statsPassing: stats.passing,
      statsDribbling: stats.dribbling,
      statsDefense: stats.defense,
      statsPhysical: stats.physical,
      latitude: athlete.latitude ?? null,
      longitude: athlete.longitude ?? null,
      isGoalkeeperForHire: athlete.isGoalkeeperForHire,
      isInjured: athlete.isInjured,
      financialDebt: athlete.financialDebt,
      hasCompletedAssessment: athlete.hasCompletedAssessment,
      pixKey: null,
      photoUrl: athlete.photoUrl ?? null,
      passwordHash: athlete.passwordHash ?? null,
    };
  }

  static toDomain(raw: PrismaAthlete): Athlete {
    const address: Address = {
      cep: raw.addressCep,
      street: raw.addressStreet,
      number: raw.addressNumber,
      complement: raw.addressComplement ?? undefined,      neighborhood: raw.addressNeighborhood,
      city: raw.addressCity,
      state: raw.addressState,
    };

    const stats: Stats = {
      pace: raw.statsPace,
      shooting: raw.statsShooting,
      passing: raw.statsPassing,
      dribbling: raw.statsDribbling,
      defense: raw.statsDefense,
      physical: raw.statsPhysical,
    };

    return new Athlete(
      raw.name,
      raw.cpf,
      raw.email,
      raw.phone,
      address,
      raw.age,
      raw.gender as 'M' | 'F',
      raw.position,
      stats,
      raw.footballLevel as FootballLevel,
      raw.id,
      raw.latitude ?? undefined,
      raw.longitude ?? undefined,
      raw.isGoalkeeperForHire,
      raw.isInjured,
      raw.financialDebt,
      raw.hasCompletedAssessment,
      raw.photoUrl ?? undefined,
      raw.passwordHash ?? undefined,
    );
  }
}
