import { hasDatabase } from '../../db/index';
import { adminRepository } from '../repositories/adminRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { walletService } from './walletService';
import { db } from '../../db';

export class AdminService {
  async getDashboardStats() {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    return await adminRepository.getDashboardStats();
  }

  async getUsers(search: string = '', status: string = 'ALL', role: string = 'ALL', page: number = 1, limit: number = 20) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * safeLimit;
    
    const { data, total } = await adminRepository.getUsers(search, status, role, safeLimit, offset);
    return {
      items: data,
      pagination: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
    };
  }

  async getUserDetail(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    const detail = await adminRepository.getUserDetail(userId);
    if (!detail) throw new Error('USER_NOT_FOUND');
    return detail;
  }

  async updateUserStatus(adminId: string, userId: string, newStatus: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'FROZEN', 'BANNED'];
    if (!validStatuses.includes(newStatus)) throw new Error('INVALID_STATUS');
    
    // Prevent self-lockout or removing last admin - simplistic check for now: don't let admin ban themselves
    if (adminId === userId) {
       throw new Error('CANNOT_MODIFY_SELF_STATUS');
    }

    const updated = await adminRepository.updateUserStatus(userId, newStatus);
    
    await auditLogRepository.log(
      adminId, 
      `USER_${newStatus}`, 
      `Admin updated user status to ${newStatus}`, 
      undefined
    );

    return updated;
  }

  async getMatches(search: string = '', status: string = 'ALL', page: number = 1, limit: number = 20) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * safeLimit;
    
    const { data, total } = await adminRepository.getMatches(search, status, safeLimit, offset);
    return {
      items: data,
      pagination: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
    };
  }

  async getMatchDetail(matchId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    const detail = await adminRepository.getMatchDetail(matchId);
    if (!detail) throw new Error('MATCH_NOT_FOUND');
    return detail;
  }

  async getTransactions(search: string = '', type: string = 'ALL', startDate: string | undefined, endDate: string | undefined, page: number = 1, limit: number = 20) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * safeLimit;
    
    const { data, total } = await adminRepository.getTransactions(search, type, startDate, endDate, safeLimit, offset);
    return {
      items: data,
      pagination: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
    };
  }

  async getGames() {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    return await adminRepository.getGames();
  }

  async updateGame(adminId: string, gameId: string, data: any) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    // Only allow specific fields
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isMatchmakingEnabled !== undefined) updateData.isMatchmakingEnabled = data.isMatchmakingEnabled;

    const updated = await adminRepository.updateGame(gameId, updateData);
    
    await auditLogRepository.log(
      adminId, 
      'GAME_UPDATED', 
      `Admin updated game ${gameId}`, 
      undefined
    );

    return updated;
  }

  async getAuditLogs(page: number = 1, limit: number = 50) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * safeLimit;
    
    const { data, total } = await adminRepository.getAuditLogs(safeLimit, offset);
    return {
      items: data,
      pagination: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
    };
  }
}

export const adminService = new AdminService();
