const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminTransactions.tsx', 'utf8');

// I'll replace the row content to include metadata
const search = `<div className="font-mono text-sm text-white">{tx.id.substring(0, 8)}...</div>`;
const replace = `<div className="font-mono text-sm text-white" title={tx.id}>{tx.id.substring(0, 8)}...</div>
                      {tx.metadata && (
                        <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={JSON.stringify(tx.metadata)}>
                          {JSON.stringify(tx.metadata).replace(/[{}"\\]/g, '')}
                        </div>
                      )}`;

code = code.replace(search, replace);
fs.writeFileSync('src/pages/admin/AdminTransactions.tsx', code);
