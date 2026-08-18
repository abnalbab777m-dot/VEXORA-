import fs from 'fs';

let code = fs.readFileSync('src/pages/admin/AdminTransactions.tsx', 'utf8');

// replace using simple substring
const startIndex = code.indexOf('{tx.metadata && (');
if (startIndex === -1) { console.log('not found'); process.exit(1); }

const endIndex = code.indexOf(')}', startIndex + 50) + 2;

const newRender = `{tx.metadata && (
                        <div className="text-xs text-gray-400 mt-1 space-y-1">
                          {tx.metadata.senderName && (
                            <div><span className="font-semibold text-gray-300">Sender:</span> {tx.metadata.senderName}</div>
                          )}
                          {tx.metadata.transactionHash && (
                            <div><span className="font-semibold text-gray-300">TXID:</span> <span className="font-mono">{tx.metadata.transactionHash}</span></div>
                          )}
                          {tx.metadata.withdrawalDetails && (
                            <div className="text-[10px] break-all leading-tight">
                              <span className="font-semibold text-gray-300">Details:</span> 
                              {Object.entries(tx.metadata.withdrawalDetails).map(([k, v]) => \`\${k}: \${v}\`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}`;

code = code.substring(0, startIndex) + newRender + code.substring(endIndex);
fs.writeFileSync('src/pages/admin/AdminTransactions.tsx', code);
