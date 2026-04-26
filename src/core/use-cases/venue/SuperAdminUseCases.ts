import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SuperAdmin } from '../../domain/entities/venue/SuperAdmin.js';
import { ISuperAdminRepository } from '../../domain/repositories/venue/ISuperAdminRepository.js';
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError.js';

// ── Setup (run once via endpoint, protected by SUPER_ADMIN_SETUP_KEY env) ──
export class SetupSuperAdminUseCase {
  constructor(private repo: ISuperAdminRepository) {}

  async execute(email: string, password: string): Promise<void> {
    const existing = await this.repo.find();
    if (existing) throw new BusinessRuleViolationError('Super admin already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.repo.save(new SuperAdmin(email, passwordHash));
  }
}

// ── Login ──
export class LoginSuperAdminUseCase {
  constructor(private repo: ISuperAdminRepository) {}

  async execute(email: string, password: string): Promise<{ token: string }> {
    const admin = await this.repo.find();
    if (!admin || admin.email !== email) throw new BusinessRuleViolationError('Invalid credentials');
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new BusinessRuleViolationError('Invalid credentials');
    const secret = process.env['JWT_SECRET']!;
    const token = jwt.sign({ sub: admin.id, role: 'super_admin' }, secret, { expiresIn: '12h' });
    return { token };
  }
}

// ── Update commission rate ──
export class UpdateCommissionRateUseCase {
  constructor(private repo: ISuperAdminRepository) {}

  async execute(rate: number): Promise<void> {
    const admin = await this.repo.find();
    if (!admin) throw new BusinessRuleViolationError('Super admin not found');
    admin.updateCommissionRate(rate);
    await this.repo.save(admin);
  }
}

// ── Update PIX / Asaas wallet ──
export class UpdateSuperAdminPaymentInfoUseCase {
  constructor(private repo: ISuperAdminRepository) {}

  async execute(params: { pixKey?: string; asaasWalletId?: string }): Promise<void> {
    const admin = await this.repo.find();
    if (!admin) throw new BusinessRuleViolationError('Super admin not found');
    if (params.pixKey !== undefined) admin.pixKey = params.pixKey;
    if (params.asaasWalletId !== undefined) admin.asaasWalletId = params.asaasWalletId;
    await this.repo.save(admin);
  }
}
