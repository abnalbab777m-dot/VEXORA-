with open('src/db/seedGames.ts', 'r') as f:
    c = f.read()

c = c.replace(
"""  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not configured. Skipping seed.');
    return;
  }""",
"""  if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER)) {
    console.log('Database is not configured. Skipping seed.');
    return;
  }"""
)

with open('src/db/seedGames.ts', 'w') as f:
    f.write(c)
