with open('src/db/index.ts', 'r') as f:
    c = f.read()

c = c.replace(
    'const connectionString = process.env.DATABASE_URL;',
    'const connectionString = process.env.DATABASE_URL;\nconst hasCloudSQL = process.env.SQL_HOST && process.env.SQL_USER;'
)

c = c.replace(
"""if (connectionString) {
  client = postgres(connectionString);
  dbInstance = drizzle(client, { schema });
}""",
"""if (hasCloudSQL) {
  client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    idle_timeout: 20
  });
  dbInstance = drizzle(client, { schema });
} else if (connectionString) {
  client = postgres(connectionString);
  dbInstance = drizzle(client, { schema });
}"""
)

c = c.replace(
"""      if (process.env.DATABASE_URL) {
        client = postgres(process.env.DATABASE_URL);
        dbInstance = drizzle(client, { schema });
      } else {
        throw new Error('DATABASE_URL is not defined. Database operations are unavailable.');
      }""",
"""      if (process.env.SQL_HOST && process.env.SQL_USER) {
        client = postgres({
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 10,
          idle_timeout: 20
        });
        dbInstance = drizzle(client, { schema });
      } else if (process.env.DATABASE_URL) {
        client = postgres(process.env.DATABASE_URL);
        dbInstance = drizzle(client, { schema });
      } else {
        throw new Error('DATABASE_URL is not defined. Database operations are unavailable.');
      }"""
)

with open('src/db/index.ts', 'w') as f:
    f.write(c)
