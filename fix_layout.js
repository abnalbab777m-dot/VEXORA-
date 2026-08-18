const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const importRegex = /import \{ Gamepad2, LayoutDashboard, Wallet, User, Trophy, LogOut \} from 'lucide-react';/;
content = content.replace(importRegex, "import { Gamepad2, LayoutDashboard, Wallet, User, Trophy, LogOut, DatabaseBackup, Info } from 'lucide-react';\nimport { useState, useEffect } from 'react';");

const userLogoutRegex = /const \{ user, logout \} = useAuth\(\);/;
const replacement = `const { user, logout } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.database === 'not_configured') {
          setIsDemoMode(true);
        }
      })
      .catch(() => {});
  }, []);`;

content = content.replace(userLogoutRegex, replacement);

const returnRegex = /return \(\n    <div className="min-h-screen flex flex-col">/;
const banner = `return (
    <div className="min-h-screen flex flex-col">
      {isDemoMode && (
        <div className="bg-[#EF4444] text-white text-xs sm:text-sm font-bold uppercase tracking-widest py-2 px-4 flex items-center justify-center gap-2 text-center z-[100] relative shadow-md">
          <DatabaseBackup className="w-4 h-4" /> 
          Demo Mode: Database not configured. Operating with local UI states only.
        </div>
      )}`;

content = content.replace(returnRegex, banner);

fs.writeFileSync('src/components/Layout.tsx', content);
