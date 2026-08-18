import fs from 'fs';

let code = fs.readFileSync('src/components/WithdrawModal.tsx', 'utf8');

const oldBody = `body: JSON.stringify({ 
          amount,
          idempotencyKey: crypto.randomUUID(),
          paymentMethodId: selectedMethod.id,
          withdrawalDetails
        })`;

const newBody = `body: JSON.stringify({ 
          amount,
          idempotencyKey: crypto.randomUUID(),
          paymentMethodId: selectedMethod.id,
          paymentMethodName: selectedMethod.name,
          paymentMethodType: selectedMethod.type,
          withdrawalDetails
        })`;

code = code.replace(oldBody, newBody);
fs.writeFileSync('src/components/WithdrawModal.tsx', code);
