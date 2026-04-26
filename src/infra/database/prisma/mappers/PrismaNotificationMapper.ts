import { Notification, NotificationType } from '../../../../core/domain/entities/Notification.js';

interface PrismaNotificationRaw {
  id: string;
  athleteId: string;
  type: string;
  title: string;
  body: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export class PrismaNotificationMapper {
  static toDomain(raw: PrismaNotificationRaw): Notification {
    return new Notification(
      raw.athleteId,
      raw.type as NotificationType,
      raw.title,
      raw.body,
      raw.referenceId ?? undefined,
      raw.id,
      raw.isRead,
      raw.createdAt,
    );
  }

  static toPrisma(notification: Notification) {
    return {
      id: notification.id,
      athleteId: notification.athleteId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      referenceId: notification.referenceId ?? null,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
