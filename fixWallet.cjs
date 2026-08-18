const fs = require('fs');
let code = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

code = code.replace(/\{isWithdrawModalOpen && \([\s\S]*?\}\)/, '');

fs.writeFileSync('src/pages/Wallet.tsx', code);
