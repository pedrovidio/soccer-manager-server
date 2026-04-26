import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  adminId: string;
  photoUrl: string;
}

export class UploadGroupPhotoUseCase {
  constructor(private readonly groupRepository: IGroupRepository) {}

  async execute({ groupId, adminId, photoUrl }: Input): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);
    if (!group.isAdmin(adminId)) throw new BusinessRuleViolationError('Only admins can update the group photo');

    group.updatePhoto(photoUrl);
    await this.groupRepository.save(group);
  }
}
