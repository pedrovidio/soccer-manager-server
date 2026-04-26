import { randomUUID } from 'crypto';

export type NotificationType = 'GROUP_INVITE' | 'INVITE_ACCEPTED' | 'INVITE_DECLINED' | 'SYSTEM';

export class Notification {
  public readonly id: string;
  public readonly athleteId: string;
  public readonly type: NotificationType;
  public readonly title: string;
  public readonly body: string;
  public readonly referenceId: string | undefined;
  public isRead: boolean;
  public readonly createdAt: Date;

  constructor(
    athleteId: string,
    type: NotificationType,
    title: string,
    body: string,
    referenceId?: string,
    id?: string,
    isRead: boolean = false,
    createdAt?: Date,
  ) {
    this.id = id ?? randomUUID();
    this.athleteId = athleteId;
    this.type = type;
    this.title = title;
    this.body = body;
    this.referenceId = referenceId;
    this.isRead = isRead;
    this.createdAt = createdAt ?? new Date();
  }

  public markAsRead(): void {
    this.isRead = true;
  }
}
