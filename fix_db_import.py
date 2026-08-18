import re

with open('src/backend/services/walletService.ts', 'r') as f:
    c = f.read()

c = c.replace("import { db }\nimport { eq } from 'drizzle-orm'; from '../../db';", "import { db } from '../../db';\nimport { eq } from 'drizzle-orm';")

with open('src/backend/services/walletService.ts', 'w') as f:
    f.write(c)

