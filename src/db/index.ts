import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export function hasDatabase(): boolean {
  return !!(process.env.DATABASE_URL || (process.env.SQL_HOST && process.env.SQL_USER));
}

let realPool: pg.Pool | undefined;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

function createPool() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });
  } else if (process.env.SQL_HOST && process.env.SQL_USER) {
    return new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME || (process.env.NODE_ENV === 'production' ? 'cloud_sql_production_database' : 'cloud_sql_development_database'),
      max: 1,
      idleTimeoutMillis: 1000, 
      connectionTimeoutMillis: 10000,
      ssl: false
    });
  } else {
    throw new Error('Database is not configured. Missing DATABASE_URL or SQL_HOST.');
  }
}

function initDb() {
  realPool = createPool();

  const poolProxy = new Proxy({}, {
    get(target, prop) {
      if (prop === 'query') {
        return async (...args: any[]) => {
          let retries = 3;
          let lastError: any = null;
          
          try {
            return await (realPool as any).query(...args);
          } catch (error: any) {
            lastError = error;
          }

          while (retries > 0) {
            if (lastError?.code === 'ECONNRESET' || lastError?.code === 'EPIPE' || lastError?.code === 'ETIMEDOUT' || lastError?.message?.includes('ECONNRESET')) {
              console.warn(`[DB] Connection lost (CPU freeze). Retries left: ${retries}. Waiting 250ms...`);
              try { await realPool?.end(); } catch (e) {}
              
              await new Promise(r => setTimeout(r, 250));
              
              realPool = createPool();
              try {
                return await (realPool as any).query(...args);
              } catch (retryError: any) {
                lastError = retryError;
                retries--;
              }
            } else {
              throw lastError;
            }
          }
          throw lastError;
        };
      }
      
      const value = (realPool as any)[prop];
      if (typeof value === 'function') {
        return value.bind(realPool);
      }
      return value;
    }
  });

  dbInstance = drizzle(poolProxy as any, { schema });
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get: (target, prop) => {
    if (!dbInstance) {
      initDb();
    }
    
    const originalProp = (dbInstance as any)[prop];
    
    // In drizzle-orm/node-postgres, execute() returns { rows: [...] }
    // But postgres-js returns [...] directly.
    // We wrap execute to return the array directly, so existing code doesn't break.
    if (prop === 'execute') {
      return async (...args: any[]) => {
        const result = await originalProp.apply(dbInstance, args);
        return result.rows || result;
      };
    }
    
    return originalProp;
  }
});
