const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminTransactions.tsx', 'utf8');

const anchor = `{JSON.stringify(tx.metadata).replace(/[{}"\\\\]/g, '')}`;
const newAnchor = `{typeof tx.metadata === 'string' ? tx.metadata.replace(/[{}"\\\\]/g, '') : JSON.stringify(tx.metadata).replace(/[{}"\\\\]/g, '')}`;

code = code.replace(anchor, newAnchor);
fs.writeFileSync('src/pages/admin/AdminTransactions.tsx', code);
