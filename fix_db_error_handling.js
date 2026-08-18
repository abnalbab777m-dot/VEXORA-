const fs = require('fs');
const path = require('path');

const controllersDir = 'src/backend/controllers';
const files = fs.readdirSync(controllersDir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace generic error catching logic to explicitly handle DATABASE_NOT_CONFIGURED
    content = content.replace(/catch \((error: any)\) {/g, 'catch ($1) {\n      if (error.message === \'DATABASE_NOT_CONFIGURED\' || error.message.includes(\'Database is not configured\')) {\n        return res.status(503).json({ success: false, data: null, error: { code: \'DATABASE_NOT_CONFIGURED\', message: \'Database not configured. Running in Demo Mode.\' } });\n      }');
    
    fs.writeFileSync(filePath, content);
  }
});
console.log('Fixed controllers');
