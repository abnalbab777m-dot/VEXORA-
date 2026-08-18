import fs from 'fs';

let code = fs.readFileSync('src/components/DepositModal.tsx', 'utf8');

code = code.replace(
  "fetch('/api/wallet/payment-methods').then(res => { console.log('[DEPOSIT] response status:', res.status); return res.json(); }).then(data => {",
  `fetch('/api/wallet/payment-methods?t=' + Date.now(), { credentials: 'include' }).then(res => {
        console.log('[DEPOSIT] response status:', res.status);
        return res.json().catch(() => ({ success: false, data: [] }));
      }).then(data => {`
);

fs.writeFileSync('src/components/DepositModal.tsx', code);
