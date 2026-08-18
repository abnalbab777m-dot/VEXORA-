const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src/pages/admin');
const files = fs.readdirSync(adminDir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove token from dependency arrays (e.g. [id, token] -> [id])
    content = content.replace(/\[(.*?)token(.*?)]/g, (match, p1, p2) => {
        const parts = [p1, p2].join('').split(',').map(s => s.trim()).filter(s => s);
        return '[' + parts.join(', ') + ']';
    });

    // Remove if (!token) return;
    content = content.replace(/if\s*\(!token\)\s*return;/g, '');
    
    // Remove if (!token || !id) return; -> if (!id) return;
    content = content.replace(/!\s*token\s*\|\|\s*/g, '');

    // Remove commented out const { token } = useAuth();
    content = content.replace(/\/\/\s*const\s*\{\s*token\s*\}\s*=\s*useAuth\(\);\n?/g, '');

    fs.writeFileSync(filePath, content);
    console.log('Fixed dependencies in', file);
  }
}
