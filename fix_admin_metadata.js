import fs from 'fs';

let code = fs.readFileSync('src/pages/admin/AdminTransactions.tsx', 'utf8');

const oldRender = `{tx.metadata && (
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

const newRender = `{tx.metadata && (
                        <div className="text-xs text-gray-400 mt-2 space-y-2 bg-black/20 p-2 rounded-lg border border-white/5">
                          {(tx.metadata.paymentMethodName || tx.metadata.paymentMethodType) && (
                            <div className="text-[#00D4FF] font-semibold flex items-center gap-1">
                                <span>{tx.metadata.paymentMethodName}</span>
                                {tx.metadata.paymentMethodType && <span className="text-[10px] bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.5 rounded ml-1">{tx.metadata.paymentMethodType}</span>}
                            </div>
                          )}
                          {tx.metadata.senderName && (
                            <div><span className="font-semibold text-gray-300">Sender:</span> <span className="text-white">{tx.metadata.senderName}</span></div>
                          )}
                          {tx.metadata.transactionHash && (
                            <div><span className="font-semibold text-gray-300">TXID:</span> <span className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">{tx.metadata.transactionHash}</span></div>
                          )}
                          {tx.metadata.withdrawalDetails && (
                            <div className="text-[11px] space-y-1 leading-tight">
                              {Object.entries(tx.metadata.withdrawalDetails).map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-gray-500 uppercase tracking-widest text-[9px]">{k.replace(/([A-Z])/g, ' $1').trim()}</span> 
                                  <span className="text-white font-mono break-all">{v as string}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/pages/admin/AdminTransactions.tsx', code);
