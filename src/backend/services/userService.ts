import { hasDatabase } from '../../db/index';
import { userRepository } from '../repositories/userRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';
import bcrypt from 'bcryptjs';

export class UserService {
  async getUserById(id: string) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }
    const user = await userRepository.findById(id);
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(id: string, data: { username?: string; avatar?: string }, ipAddress?: string) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }
    
    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new Error('Username is already taken');
      }
    }

    const updatedUser = await userRepository.update(id, data);
    if (!updatedUser) throw new Error('User not found');

    await auditLogRepository.log(id, 'PROFILE_UPDATE', JSON.stringify(data), ipAddress);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string, ipAddress?: string) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await userRepository.update(id, { passwordHash: newPasswordHash });

    await auditLogRepository.log(id, 'PASSWORD_CHANGE', undefined, ipAddress);

    return true;
  }
}

export const userService = new UserService();

