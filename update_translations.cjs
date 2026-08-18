const fs = require('fs');

const enPath = 'src/locales/en/translation.json';
const arPath = 'src/locales/ar/translation.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enData.nav.leaderboard = 'Leaderboard';
enData.nav.friends = 'Friends';
enData.nav.notifications = 'Notifications';
enData.nav.admin = 'Admin Panel';

arData.nav.leaderboard = 'لوحة المتصدرين';
arData.nav.friends = 'الأصدقاء';
arData.nav.notifications = 'الإشعارات';
arData.nav.admin = 'لوحة الإدارة';

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arData, null, 2));
