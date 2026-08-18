const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/backend/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('db.') || content.includes('db(')) {
    if (!content.includes('import { db') && !content.includes(', db }') && !content.includes(' db,') && !content.includes('{db}')) {
      const depth = file.split('/').length - 2; 
      const relativePath = '../'.repeat(depth) + 'db/index';
      // Find `import { hasDatabase } from ...` and modify it to `import { hasDatabase, db }`
      if (content.includes(`import { hasDatabase } from '${relativePath}';`)) {
        content = content.replace(`import { hasDatabase } from '${relativePath}';`, `import { hasDatabase, db } from '${relativePath}';`);
      } else {
        content = `import { db } from '${relativePath}';\n` + content;
      }
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
}
