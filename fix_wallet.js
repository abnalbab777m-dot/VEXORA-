const fs = require('fs');

let c = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

c = c.replace(/if \(data\.error\?.code === 'DATABASE_NOT_CONFIGURED'\) \{[^}]*\}/g, '');
c = c.replace(/setWallet\(null\);\n\s+setError\(data\.error\?.message \|\| 'Failed to fetch wallet'\);/, `if (data.error?.code === 'DATABASE_NOT_CONFIGURED') {
            setIsDemoMode(true);
            setWallet({
              balance: '0.00', availableBalance: '0.00', lockedBalance: '0.00',
              totalDeposits: '0.00', totalWithdrawals: '0.00'
            });
            setTransactions([]);
          } else {
            setWallet(null);
            setError(data.error?.message || 'Failed to fetch wallet');
          }`);

const stateInsert = `const [activeTab, setActiveTab] = useState<'all' | 'DEPOSIT' | 'WITHDRAW'>('all');\n  const [isDemoMode, setIsDemoMode] = useState(false);`;
c = c.replace(/const \[activeTab, setActiveTab\] = useState\w*\([^)]*\);/, stateInsert);

// Fix transaction buttons to show toast or alert in Demo mode
c = c.replace(/const handleTransaction = async \(type: 'deposit' \| 'withdraw'\) => \{/g, `const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (isDemoMode) {
      alert('Wallet operations are disabled in Demo Mode.');
      setIsDepositModalOpen(false);
      setIsWithdrawModalOpen(false);
      return;
    }`);

fs.writeFileSync('src/pages/Wallet.tsx', c);
