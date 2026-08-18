import re

with open('src/backend/services/walletService.ts', 'r') as f:
    c = f.read()

c = c.replace("pass", "")

if "import { eq" not in c:
    c = c.replace("import { db }", "import { db }\nimport { eq } from 'drizzle-orm';")

with open('src/backend/services/walletService.ts', 'w') as f:
    f.write(c)

