import { PrismaClient } from '@prisma/client';
import { Notification } from '../../../../core/domain/entities/Notification.js';
import { INotificationRepository } from '../../../../core/domain/repositories/INotificationRepository.js';
import { PrismaNotificationMapper } from '../mappers/PrismaNotificationMapper.js';

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const data = PrismaNotificationMapper.toPrisma(notification);
    await this.prisma.notification.upsert({
      where: { id: notification.id },
      update: data,
      create: data,
    });
  }

  async findByAthlete(athleteId: string): Promise<Notification[]> {
    const results = await this.prisma.notification.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => PrismaNotificationMapper.toDomain(r as any));
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async countUnread(athleteId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { athleteId, isRead: false },
    });
  }
}
