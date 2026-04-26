import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Define como o goleiro fixo do grupo (não contratado) participa financeiramente.
 * SPLIT   — entra na divisão do custo da partida como qualquer outro jogador.
 * MONTHLY — paga mensalidade normalmente.
 * FREE    — isento de pagamento (benefício do grupo).
 */
export type GoalkeeperPaymentMode = 'SPLIT' | 'MONTHLY' | 'FREE';

export class Group {
  public readonly id: string;
  public name: string;
  public description: string | undefined;
  public adminIds: string[];
  public pixKey?: string | undefined;
  public photoUrl: string | undefined;
  public memberIds: string[];
  public baseLocation: { latitude: number; longitude: number } | undefined;
  public status: GroupStatus;
  public goalkeeperPaymentMode: GoalkeeperPaymentMode;

  constructor(
    name: string,
    adminIds: string[],
    memberIds: string[] = [],
    status: GroupStatus = GroupStatus.ACTIVE,
    baseLocation?: { latitude: number; longitude: number },
    pixKey?: string,
    id?: string,
    description?: string,
    photoUrl?: string,
    goalkeeperPaymentMode: GoalkeeperPaymentMode = 'SPLIT',
  ) {
    this.validateName(name);

    this.id = id ?? randomUUID();
    this.name = name;
    this.description = description;
    this.adminIds = [...new Set(adminIds)];
    this.memberIds = [...new Set(memberIds)];
    this.status = status;
    this.pixKey = pixKey;
    this.baseLocation = baseLocation;
    this.photoUrl = photoUrl;
    this.goalkeeperPaymentMode = goalkeeperPaymentMode;
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new BusinessRuleViolationError('Group name cannot be empty');
    }
    if (name.trim().length < 3) {
      throw new BusinessRuleViolationError('Group name must have at least 3 characters');
    }
  }

  public isAdmin(athleteId: string): boolean {
    return this.adminIds.includes(athleteId);
  }

  public isMensalista(athleteId: string): boolean {
    return this.memberIds.includes(athleteId);
  }

  public addMensalista(athleteId: string): void {
    if (this.isMensalista(athleteId)) {
      throw new BusinessRuleViolationError('Athlete is already a mensalista in this group');
    }
    this.memberIds.push(athleteId);
  }

  public updatePhoto(url: string): void {
    this.photoUrl = url;
  }
}
