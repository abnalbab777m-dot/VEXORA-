import re

with open('server.ts', 'r') as f:
    c = f.read()

c = c.replace(
"""      if (!process.env.DATABASE_URL) {
        return res.json({ backend: "ok", database: "not_configured" });
      }""",
"""      if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER)) {
        return res.json({ backend: "ok", database: "not_configured" });
      }"""
)

with open('server.ts', 'w') as f:
    f.write(c)
