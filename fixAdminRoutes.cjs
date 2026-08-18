const fs = require('fs');
let code = fs.readFileSync('src/backend/routes/adminRoutes.ts', 'utf8');

const anchor = `// Audit Logs`;
const toInsert = `
// Payment Methods
router.get('/payment-methods', adminController.getPaymentMethods);
router.post('/payment-methods', adminController.createPaymentMethod);
router.put('/payment-methods/:id', adminController.updatePaymentMethod);

`;

code = code.replace(anchor, toInsert + anchor);
fs.writeFileSync('src/backend/routes/adminRoutes.ts', code);
