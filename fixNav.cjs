const fs = require('fs');
let code = fs.readFileSync('src/components/AdminNavigation.tsx', 'utf8');

const navItem = `{ to: '/admin/settings', label: 'Settings', icon: DollarSign },`;
const newNavItem = navItem + `\n    { to: '/admin/payment-methods', label: 'Payment Methods', icon: DollarSign },`;

code = code.replace(navItem, newNavItem);
fs.writeFileSync('src/components/AdminNavigation.tsx', code);
