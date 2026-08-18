import { apiLimiter } from './src/backend/middlewares/rateLimitMiddleware';

import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index";
import { users, games } from "./src/db/schema";
import { eq } from "drizzle-orm";

import authRoutes from './src/backend/routes/authRoutes';
import userRoutes from './src/backend/routes/userRoutes';
import walletRoutes from './src/backend/routes/walletRoutes';
import gameRoutes from './src/backend/routes/gameRoutes';
import matchmakingRoutes from './src/backend/routes/matchmakingRoutes';
import matchRoutes from './src/backend/routes/matchRoutes';
import adminRoutes from './src/backend/routes/adminRoutes';
import statisticsRoutes from './src/backend/routes/statisticsRoutes';
import gameInvitationRoutes from './src/backend/routes/gameInvitationRoutes';
import friendRoutes from './src/backend/routes/friendRoutes';
import notificationRoutes from './src/backend/routes/notificationRoutes';

import { initDevDb } from './fix_dev_db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  await initDevDb();

  // Middleware
  const isProd = process.env.NODE_ENV === "production";
  app.use(helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: isProd ? (process.env.CORS_ORIGIN || '*') : '*',
    credentials: true,
  }));
  
  // Trust proxy if behind a load balancer (like Cloud Run)
  app.set('trust proxy', 1);

  // Apply general rate limit to all /api routes
  app.use('/api', apiLimiter);
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/matchmaking', matchmakingRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', statisticsRoutes);
  app.use('/api/invitations', gameInvitationRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/notifications', notificationRoutes);

  // API Routes
  
  app.get("/api/debug-env", (req, res) => {
    res.json({
      SQL_HOST: process.env.SQL_HOST,
      SQL_USER: process.env.SQL_USER,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    });
  });

  
  
app.get('/api/db-raw', async (req, res) => {
  const pg = require('pg');
  const pool = new pg.Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME || 'cloud_sql_production_database',
    max: 1
  });
  
  try {
    const resDb = await pool.query('SELECT 1 as num');
    res.json({ ok: true, num: resDb.rows[0].num });
  } catch(e: any) {
    res.json({ ok: false, error: e.message, code: e.code, syscall: e.syscall, address: e.address, port: e.port });
  } finally {
    await pool.end();
  }
});

  
app.get('/api/fs-debug', async (req, res) => {
  const fs = require('fs');
  const result: any = {};
  
  try {
    result.appCloudSql = fs.readdirSync('/app/cloudsql');
  } catch(e: any) {
    result.appCloudSqlErr = e.message;
  }
  
  try {
    result.cloudSql = fs.readdirSync('/cloudsql');
  } catch(e: any) {
    result.cloudSqlErr = e.message;
  }
  
  res.json(result);
});

  app.get("/api/db-debug", async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL || "none";
      const sqlHost = process.env.SQL_HOST || "none";
      const sqlDb = process.env.SQL_DB_NAME || "none";
      
      let errorMsg = "none";
      try {
        const { db } = await import('./src/db/index.js');
        const { users } = await import('./src/db/schema.js');
        await db.select({ id: users.id }).from(users).limit(1);
      } catch (err: any) {
        errorMsg = err.message + " | CAUSE: " + (err.cause?.message || err.cause);
      }
      
      res.json({
        dbUrl: dbUrl.substring(0, 20) + "...",
        sqlHost,
        sqlDb,
        errorMsg
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/health", async (req, res) => {
    try {
      if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER)) {
        return res.json({ backend: "ok", database: "not_configured" });
      }
      
      // Test DB connection
      const result = await db.select({ id: users.id }).from(users).limit(1);
      res.json({ backend: "ok", database: "ok" });
    } catch (error) {
      console.error("Health check DB error:", error);
      res.status(500).json({ backend: "ok", database: "error", error: { code: "DB_ERROR", message: "Database connection failed" } });
    }
  });

  // Basic API placeholders for VEXORA
  app.get("/api/games", async (req, res) => {
    try {
      if (!process.env.DATABASE_URL) {
        return res.json({ success: true, data: [] });
      }
      
      const allGames = await db.select().from(games);
      res.json({ success: true, data: allGames });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: "Failed to fetch games" } });
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', process.env.NODE_ENV === "production" ? err.message : err);
    res.status(500).json({
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  
app.get('/api/health/diag', async (req, res) => {
  const pg = require('pg');
  const pool = new pg.Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME || 'cloud_sql_production_database',
    max: 1
  });
  
  let result = '';
  try {
    const start = Date.now();
    const resDb = await pool.query('SELECT 1 as num');
    result = 'DB OK: ' + resDb.rows[0].num + ' in ' + (Date.now() - start) + 'ms';
  } catch(e) {
    result = 'DB ERR: ' + (e as Error).message + ' | CODE: ' + (e as any).code;
  } finally {
    await pool.end();
  }
  
  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      K_REVISION: process.env.K_REVISION,
      K_SERVICE: process.env.K_SERVICE,
      SQL_HOST: process.env.SQL_HOST,
      SQL_USER: process.env.SQL_USER,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      HAS_DB_URL: !!process.env.DATABASE_URL
    },
    db: result
  });
});

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
