import fs from 'fs';
let code = fs.readFileSync('src/backend/middlewares/authMiddleware.ts', 'utf8');

code = code.replace(
  "const token = req.cookies?.token;",
  "const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];"
);

fs.writeFileSync('src/backend/middlewares/authMiddleware.ts', code);
