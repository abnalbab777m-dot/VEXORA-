import fs from 'fs';

let deposit = fs.readFileSync('src/components/DepositModal.tsx', 'utf8');
deposit = deposit.replace(/import { useAuth } from '\.\.\/contexts\/AuthContext';\n/, '');
deposit = deposit.replace(/  const { token } = useAuth\(\);\n/, '');
deposit = deposit.replace(/      fetch\('\/api\/wallet\/payment-methods', {\n        headers: { Authorization: `Bearer \$\{token\}` }\n      }\)/, "      fetch('/api/wallet/payment-methods')");
deposit = deposit.replace(/        headers: { \n          'Content-Type': 'application\/json',\n          Authorization: `Bearer \$\{token\}`\n        }/, "        headers: { 'Content-Type': 'application/json' }");
deposit = deposit.replace(/  }, \[isOpen, token\]\);/, "  }, [isOpen]);");
fs.writeFileSync('src/components/DepositModal.tsx', deposit);

let withdraw = fs.readFileSync('src/components/WithdrawModal.tsx', 'utf8');
withdraw = withdraw.replace(/import { useAuth } from '\.\.\/contexts\/AuthContext';\n/, '');
withdraw = withdraw.replace(/  const { token } = useAuth\(\);\n/, '');
fs.writeFileSync('src/components/WithdrawModal.tsx', withdraw);

let authMw = fs.readFileSync('src/backend/middlewares/authMiddleware.ts', 'utf8');
authMw = authMw.replace(/  const authHeader = req\.headers\.authorization;\n  const token = req\.cookies\?\.token \|\| \(authHeader && authHeader\.startsWith\('Bearer '\) \? authHeader\.split\(' '\)\[1\] : null\);\n/, "  const token = req.cookies?.token;\n");
fs.writeFileSync('src/backend/middlewares/authMiddleware.ts', authMw);
