import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { auditLogs } from '../../db/schema';

export class AuditLogRepository {
  async log(userId: string, action: string, details?: string, ipAddress?: string, tx?: any) {
    if (!hasDatabase()) return; // Graceful degradation

    const q = tx || db;
    await q.insert(auditLogs).values({
      userId,
      action,
      details,
      ipAddress,
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
