const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src/pages/admin');
const files = fs.readdirSync(adminDir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove token from useAuth()
    content = content.replace(/const \{([^}]*)token([^}]*)\} = useAuth\(\);/g, (match, before, after) => {
        let inside = before + after;
        inside = inside.split(',').map(s => s.trim()).filter(s => s).join(', ');
        if (inside) {
            return `const { ${inside} } = useAuth();`;
        }
        return `// const { token } = useAuth();`;
    });

    // Remove Authorization header completely if it's the only header
    content = content.replace(/headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}/g, '');
    
    // Remove Authorization header if it's inside other headers
    content = content.replace(/Authorization:\s*`Bearer \$\{token\}`\s*,?/g, '');

    // Cleanup empty headers objects like `headers: { }` or `headers: { , }`
    content = content.replace(/headers:\s*\{\s*,?\s*\}/g, '');

    // Clean up empty options object `fetch(url, { })`
    content = content.replace(/,\s*\{\s*\}/g, '');

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
