const fs = require('fs');
let code = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

// Replace imports
code = code.replace(
  `import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';`,
  `import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';\nimport { DepositModal } from '../components/DepositModal';\nimport { WithdrawModal } from '../components/WithdrawModal';`
);

// Replace the handleTransaction which we don't need anymore, except maybe keeping the state of modals
// Wait, we can just edit the file directly using regex.

code = code.replace(/\{(\/\* Deposit Modal \*\/)[\s\S]*?\{(\/\* Withdraw Modal \*\/)[\s\S]*?\}/, 
`{/* Deposit Modal */}
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
        isDemoMode={isDemoMode}
        onSuccess={fetchData}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        isDemoMode={isDemoMode}
        onSuccess={fetchData}
      />`);
      
fs.writeFileSync('src/pages/Wallet.tsx', code);
