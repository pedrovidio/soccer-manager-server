import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { VenueOwner } from '../../domain/entities/venue/VenueOwner.js';
import { IVenueOwnerRepository } from '../../domain/repositories/venue/IVenueRepositories.js';
import { ISuperAdminRepository } from '../../domain/repositories/venue/ISuperAdminRepository.js';
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError.js';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError.js';

// ── Register ──
export class RegisterVenueOwnerUseCase {
  constructor(private repo: IVenueOwnerRepository) {}

  async execute(input: { name: string; email: string; phone: string; cpfCnpj: string; password: string; pixKey?: string; asaasWalletId?: string }): Promise<{ id: string }> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw new BusinessRuleViolationError('Email already registered');
    const passwordHash = await bcrypt.hash(input.password, 10);
    const owner = new VenueOwner(input.name, input.email, input.phone, input.cpfCnpj, passwordHash, undefined, 'PENDING', input.asaasWalletId, input.pixKey);
    await this.repo.save(owner);
    return { id: owner.id };
  }
}

// ── Login ──
export class LoginVenueOwnerUseCase {
  constructor(private repo: IVenueOwnerRepository) {}

  async execute(email: string, password: string): Promise<{ token: string; ownerId: string }> {
    const owner = await this.repo.findByEmail(email);
    if (!owner) throw new BusinessRuleViolationError('Invalid credentials');
    const valid = await bcrypt.compare(password, owner.passwordHash);
    if (!valid) throw new BusinessRuleViolationError('Invalid credentials');
    if (!owner.isApproved()) throw new BusinessRuleViolationError('Account is pending approval');
    const secret = process.env['JWT_SECRET']!;
    const token = jwt.sign({ sub: owner.id, role: 'venue_owner' }, secret, { expiresIn: '7d' });
    return { token, ownerId: owner.id };
  }
}

// ── Approve / Reject (super admin) ──
export class ReviewVenueOwnerUseCase {
  constructor(
    private venueOwnerRepo: IVenueOwnerRepository,
    private superAdminRepo: ISuperAdminRepository,
  ) {}

  async execute(venueOwnerId: string, action: 'approve' | 'reject'): Promise<void> {
    const owner = await this.venueOwnerRepo.findById(venueOwnerId);
    if (!owner) throw new EntityNotFoundError('VenueOwner', venueOwnerId);
    action === 'approve' ? owner.approve() : owner.reject();
    await this.venueOwnerRepo.save(owner);
  }
}

// ── List pending (super admin) ──
export class ListPendingVenueOwnersUseCase {
  constructor(private repo: IVenueOwnerRepository) {}

  async execute(): Promise<VenueOwner[]> {
    return this.repo.findPending();
  }
}
