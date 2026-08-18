import fs from 'fs';

let content = fs.readFileSync('src/db/index.ts', 'utf-8');
content = content.replace(
  "export const db = new Proxy({} as any, {",
  "export const db = new Proxy({} as NodePgDatabase<typeof schema>, {"
);
fs.writeFileSync('src/db/index.ts', content);
