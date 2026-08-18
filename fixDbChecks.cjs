const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/backend/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('process.env.DATABASE_URL')) {
    // We will replace `!process.env.DATABASE_URL` with `!hasDatabase()`
    // and import it if not present.
    content = content.replace(/!process\.env\.DATABASE_URL/g, '!hasDatabase()');
    
    // Some checks use `if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER))`
    content = content.replace(/!hasDatabase\(\)\s*&&\s*!\(process\.env\.SQL_HOST\s*&&\s*process\.env\.SQL_USER\)/g, '!hasDatabase()');
    
    if (!content.includes('import { hasDatabase }')) {
      // Find the relative path to src/db
      const depth = file.split('/').length - 2; // e.g. src/backend/services/x.ts -> 3. depth=2
      const relativePath = '../'.repeat(depth) + 'db/index';
      content = `import { hasDatabase } from '${relativePath}';\n` + content;
    }
    
    fs.writeFileSync(file, content);
  }
}
