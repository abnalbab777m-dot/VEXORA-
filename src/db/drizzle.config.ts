import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const hasCloudSQL = process.env.SQL_HOST && process.env.SQL_ADMIN_USER;

export default defineConfig(hasCloudSQL ? {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.SQL_HOST as string,
    user: process.env.SQL_ADMIN_USER as string,
    password: process.env.SQL_ADMIN_PASSWORD as string,
    database: process.env.SQL_DB_NAME as string,
    ssl: false
  }
} : {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string
  }
});
