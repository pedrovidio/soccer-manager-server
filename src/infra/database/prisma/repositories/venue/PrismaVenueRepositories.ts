import { PrismaClient } from '@prisma/client';
import { SuperAdmin } from '../../../../../core/domain/entities/venue/SuperAdmin.js';
import { VenueOwner } from '../../../../../core/domain/entities/venue/VenueOwner.js';
import { Venue, Court, CourtAvailability, MatchVenueRecord, MatchType } from '../../../../../core/domain/entities/venue/Venue.js';
import {
  IVenueOwnerRepository,
  IVenueRepository,
  ICourtRepository,
  ICourtAvailabilityRepository,
  IMatchVenueRecordRepository,
} from '../../../../../core/domain/repositories/venue/IVenueRepositories.js';
import { ISuperAdminRepository } from '../../../../../core/domain/repositories/venue/ISuperAdminRepository.js';

export class PrismaSuperAdminRepository implements ISuperAdminRepository {
  constructor(private prisma: PrismaClient) {}

  async find(): Promise<SuperAdmin | null> {
    const raw = await this.prisma.superAdmin.findFirst();
    if (!raw) return null;
    return new SuperAdmin(raw.email, raw.passwordHash, raw.id, raw.pixKey ?? undefined, raw.asaasWalletId ?? undefined, raw.commissionRate);
  }

  async save(s: SuperAdmin): Promise<void> {
    await this.prisma.superAdmin.upsert({
      where: { id: s.id },
      update: { pixKey: s.pixKey ?? null, asaasWalletId: s.asaasWalletId ?? null, commissionRate: s.commissionRate, passwordHash: s.passwordHash },
      create: { id: s.id, email: s.email, passwordHash: s.passwordHash, pixKey: s.pixKey ?? null, asaasWalletId: s.asaasWalletId ?? null, commissionRate: s.commissionRate },
    });
  }
}

export class PrismaVenueOwnerRepository implements IVenueOwnerRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(raw: any): VenueOwner {
    return new VenueOwner(raw.name, raw.email, raw.phone, raw.cpfCnpj, raw.passwordHash, raw.id, raw.status, raw.asaasWalletId ?? undefined, raw.pixKey ?? undefined, raw.createdAt);
  }

  async save(v: VenueOwner): Promise<void> {
    await this.prisma.venueOwner.upsert({
      where: { id: v.id },
      update: { status: v.status, asaasWalletId: v.asaasWalletId ?? null, pixKey: v.pixKey ?? null, passwordHash: v.passwordHash },
      create: { id: v.id, name: v.name, email: v.email, phone: v.phone, cpfCnpj: v.cpfCnpj, passwordHash: v.passwordHash, status: v.status, asaasWalletId: v.asaasWalletId ?? null, pixKey: v.pixKey ?? null },
    });
  }

  async findById(id: string): Promise<VenueOwner | null> {
    const raw = await this.prisma.venueOwner.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<VenueOwner | null> {
    const raw = await this.prisma.venueOwner.findUnique({ where: { email } });
    return raw ? this.toDomain(raw) : null;
  }

  async findPending(): Promise<VenueOwner[]> {
    const results = await this.prisma.venueOwner.findMany({ where: { status: 'PENDING' } });
    return results.map((r) => this.toDomain(r));
  }
}

export class PrismaVenueRepository implements IVenueRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(raw: any): Venue {
    return new Venue(raw.venueOwnerId, raw.name, raw.address, raw.latitude, raw.longitude, raw.id, raw.photoUrl ?? undefined);
  }

  async save(v: Venue): Promise<void> {
    await this.prisma.venue.upsert({
      where: { id: v.id },
      update: { name: v.name, address: v.address, latitude: v.latitude, longitude: v.longitude, photoUrl: v.photoUrl ?? null },
      create: { id: v.id, venueOwnerId: v.venueOwnerId, name: v.name, address: v.address, latitude: v.latitude, longitude: v.longitude, photoUrl: v.photoUrl ?? null },
    });
  }

  async findById(id: string): Promise<Venue | null> {
    const raw = await this.prisma.venue.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async listByOwner(venueOwnerId: string): Promise<Venue[]> {
    const results = await this.prisma.venue.findMany({ where: { venueOwnerId } });
    return results.map((r) => this.toDomain(r));
  }
}

export class PrismaCourtRepository implements ICourtRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(raw: any): Court {
    return new Court(raw.venueId, raw.name, raw.type as MatchType, raw.isCovered, raw.rentalPrice, raw.id);
  }

  async save(c: Court): Promise<void> {
    await this.prisma.court.upsert({
      where: { id: c.id },
      update: { name: c.name, type: c.type, isCovered: c.isCovered, rentalPrice: c.rentalPrice },
      create: { id: c.id, venueId: c.venueId, name: c.name, type: c.type, isCovered: c.isCovered, rentalPrice: c.rentalPrice },
    });
  }

  async findById(id: string): Promise<Court | null> {
    const raw = await this.prisma.court.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async listByVenue(venueId: string): Promise<Court[]> {
    const results = await this.prisma.court.findMany({ where: { venueId } });
    return results.map((r) => this.toDomain(r));
  }

  async findAvailable(date: Date, type?: MatchType) {
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const results = await this.prisma.court.findMany({
      where: {
        ...(type && { type }),
        availabilities: { some: { date: { gte: startOfDay, lte: endOfDay }, status: 'OPEN' } },
      },
      include: {
        availabilities: { where: { date: { gte: startOfDay, lte: endOfDay }, status: 'OPEN' }, take: 1 },
        venue: { select: { name: true, address: true } },
      },
    });

    return results
      .filter((r) => r.availabilities.length > 0)
      .map((r) => {
        const avail = r.availabilities[0]!;
        return {
          ...this.toDomain(r),
          availability: new CourtAvailability(r.id, avail.date, avail.startTime, avail.endTime, avail.inviteSpotAthletes, avail.id, avail.status as any, avail.createdAt),
          venueName: r.venue.name,
          venueAddress: r.venue.address,
        };
      });
  }
}

export class PrismaCourtAvailabilityRepository implements ICourtAvailabilityRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(raw: any): CourtAvailability {
    return new CourtAvailability(raw.courtId, raw.date, raw.startTime, raw.endTime, raw.inviteSpotAthletes, raw.id, raw.status, raw.createdAt);
  }

  async save(a: CourtAvailability): Promise<void> {
    await this.prisma.courtAvailability.upsert({
      where: { id: a.id },
      update: { status: a.status },
      create: { id: a.id, courtId: a.courtId, date: a.date, startTime: a.startTime, endTime: a.endTime, status: a.status, inviteSpotAthletes: a.inviteSpotAthletes },
    });
  }

  async findById(id: string): Promise<CourtAvailability | null> {
    const raw = await this.prisma.courtAvailability.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findOpenByCourt(courtId: string): Promise<CourtAvailability[]> {
    const raw = await this.prisma.courtAvailability.findMany({
      where: { courtId, status: 'OPEN' },
      orderBy: { date: 'asc' },
    });
    return raw.map((r) => this.toDomain(r));
  }

  async findOpenWithSpotInvite(): Promise<(CourtAvailability & { court: Court })[]> {
    const results = await this.prisma.courtAvailability.findMany({
      where: { status: 'OPEN', inviteSpotAthletes: true },
      include: { court: true },
    });
    return results.map((r) => Object.assign(this.toDomain(r), {
      court: new Court(r.court.venueId, r.court.name, r.court.type as MatchType, r.court.isCovered, r.court.rentalPrice, r.court.id),
    }));
  }
}

export class PrismaMatchVenueRecordRepository implements IMatchVenueRecordRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(raw: any): MatchVenueRecord {
    return new MatchVenueRecord(raw.matchId, raw.courtId, raw.venueOwnerId, raw.createdByType, raw.createdById, raw.rentalPrice, raw.commissionRate, raw.id, raw.createdAt);
  }

  async save(r: MatchVenueRecord): Promise<void> {
    await this.prisma.matchVenueRecord.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, matchId: r.matchId, courtId: r.courtId, venueOwnerId: r.venueOwnerId, createdByType: r.createdByType, createdById: r.createdById, rentalPrice: r.rentalPrice, commissionRate: r.commissionRate, commissionAmount: r.commissionAmount },
    });
  }

  async listByVenueOwner(venueOwnerId: string): Promise<MatchVenueRecord[]> {
    const results = await this.prisma.matchVenueRecord.findMany({ where: { venueOwnerId }, orderBy: { createdAt: 'desc' } });
    return results.map((r) => this.toDomain(r));
  }

  async findByMatch(matchId: string): Promise<MatchVenueRecord | null> {
    const raw = await this.prisma.matchVenueRecord.findFirst({ where: { matchId } });
    return raw ? this.toDomain(raw) : null;
  }
}
