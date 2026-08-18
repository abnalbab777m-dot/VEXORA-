const fs = require('fs');

let c = fs.readFileSync('src/backend/controllers/matchResultController.ts', 'utf8');

c = c.replace(/if \(error\.message === 'DATABASE_NOT_CONFIGURED'\) {\n\s+return res\.status\(400\)\.json\({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database is not configured' } }\);\n\s+}\n\s+/g, '');

const importZod = `import { z } from 'zod';\n`;
if (!c.includes('import { z }')) {
  c = c.replace(`import { matchResultService } from '../services/matchResultService';`, `import { matchResultService } from '../services/matchResultService';\nimport { z } from 'zod';`);
}

const validationSchema = `
const submitResultSchema = z.object({
  winnerId: z.string().min(1),
  score: z.string().min(1).max(20),
  evidenceUrl: z.string().url().max(2048).optional().or(z.literal(''))
});
`;
if (!c.includes('submitResultSchema')) {
  c = c.replace(`export class MatchResultController {`, `${validationSchema}\nexport class MatchResultController {`);
}

c = c.replace(`const { winnerId, score, evidenceUrl } = req.body;`, `const { winnerId, score, evidenceUrl } = submitResultSchema.parse(req.body);`);
c = c.replace(`if (error.message === 'MATCH_NOT_FOUND') {`, `if (error instanceof z.ZodError) {\n        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });\n      }\n      if (error.message === 'MATCH_NOT_FOUND') {`);

fs.writeFileSync('src/backend/controllers/matchResultController.ts', c);
