import postgres from 'postgres';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER,
    password: process.env.SQL_ADMIN_PASSWORD,
    database: 'postgres',
    max: 1
  });

  try {
    await client`CREATE DATABASE ai_studio_app_user`;
    console.log("Created ai_studio_app_user database!");
    
    // Grant privileges
    await client`GRANT ALL PRIVILEGES ON DATABASE ai_studio_app_user TO ai_studio_app_user`;
    console.log("Granted privileges!");
  } catch(e) {
    console.error("ERR:", e.message);
  }
  process.exit(0);
}
run();
