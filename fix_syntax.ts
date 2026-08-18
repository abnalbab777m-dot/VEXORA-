import fs from 'fs';

function restore(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/\(await db\.execute\((.*?)\)\)\.rows/gs, 'await db.execute($1)');
  content = content.replace(/db\.execute\((.*?)\)\.then\(res => res\.rows\)/gs, 'db.execute($1)');
  fs.writeFileSync(filePath, content);
}

restore('src/backend/repositories/adminRepository.ts');
restore('src/backend/repositories/statisticsRepository.ts');
