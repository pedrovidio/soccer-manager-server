import { Group, GroupStatus } from '../../../../core/domain/entities/Group.js';

interface PrismaGroupRaw {
  id: string;
  name: string;
  description: string;
  admin_ids: string[];
  member_ids: string[];
  base_location_latitude: number | null;
  base_location_longitude: number | null;
  status: string;
}

export class PrismaGroupMapper {
  static toDomain(raw: PrismaGroupRaw): Group {
    const baseLocation = raw.base_location_latitude !== null && raw.base_location_longitude !== null
      ? {
          latitude: raw.base_location_latitude,
          longitude: raw.base_location_longitude,
        }
      : undefined;

    return new Group(
      raw.name,
      raw.description,
      raw.admin_ids,
      raw.member_ids,
      raw.status as GroupStatus,
      baseLocation,
      raw.id,
    );
  }

  static toPrisma(group: Group): any {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      admin_ids: group.adminIds,
      member_ids: group.memberIds,
      base_location_latitude: group.baseLocation?.latitude ?? null,
      base_location_longitude: group.baseLocation?.longitude ?? null,
      status: group.status,
    };
  }
}
