import { Group, GroupStatus, GoalkeeperPaymentMode } from '../../../../core/domain/entities/Group.js';

interface PrismaGroupRaw {
  id: string;
  name: string;
  description: string | null;
  adminIds: string[];
  memberIds: string[];
  baseLocationLatitude: number | null;
  baseLocationLongitude: number | null;
  pixKey: string | null;
  photoUrl: string | null;
  status: string;
  goalkeeperPaymentMode: string;
}

export class PrismaGroupMapper {
  static toDomain(raw: PrismaGroupRaw): Group {
    const baseLocation =
      raw.baseLocationLatitude !== null && raw.baseLocationLongitude !== null
        ? { latitude: raw.baseLocationLatitude, longitude: raw.baseLocationLongitude }
        : undefined;

    return new Group(
      raw.name,
      raw.adminIds,
      raw.memberIds,
      raw.status as GroupStatus,
      baseLocation,
      raw.pixKey ?? undefined,
      raw.id,
      raw.description ?? undefined,
      raw.photoUrl ?? undefined,
      raw.goalkeeperPaymentMode as GoalkeeperPaymentMode,
    );
  }

  static toPrisma(group: Group) {
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      adminIds: group.adminIds,
      memberIds: group.memberIds,
      baseLocationLatitude: group.baseLocation?.latitude ?? null,
      baseLocationLongitude: group.baseLocation?.longitude ?? null,
      pixKey: group.pixKey ?? null,
      photoUrl: group.photoUrl ?? null,
      status: group.status,
      goalkeeperPaymentMode: group.goalkeeperPaymentMode,
    };
  }
}
