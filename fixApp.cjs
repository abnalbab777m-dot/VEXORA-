const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStr = `const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));`;
const newImportStr = importStr + `\nconst AdminPaymentMethods = React.lazy(() => import('./pages/admin/AdminPaymentMethods').then(m => ({ default: m.AdminPaymentMethods })));`;
code = code.replace(importStr, newImportStr);

const routeStr = `<Route path="/admin/settings" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminSettings /></Suspense>
              } />`;
const newRouteStr = routeStr + `\n              <Route path="/admin/payment-methods" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminPaymentMethods /></Suspense>
              } />`;
code = code.replace(routeStr, newRouteStr);

fs.writeFileSync('src/App.tsx', code);
