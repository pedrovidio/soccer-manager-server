import { SuperAdmin } from '../../entities/venue/SuperAdmin.js';

export interface ISuperAdminRepository {
  find(): Promise<SuperAdmin | null>;
  save(superAdmin: SuperAdmin): Promise<void>;
}
