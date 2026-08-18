import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Games } from './pages/Games';
import { Wallet } from './pages/Wallet';
import { Matchmaking } from './pages/Matchmaking';
import { Match } from './pages/Match';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { Friends } from './pages/Friends';
import { Notifications } from './pages/Notifications';
import { Auth } from './pages/Auth';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy loading admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminUserDetail = React.lazy(() => import('./pages/admin/AdminUserDetail').then(m => ({ default: m.AdminUserDetail })));
const AdminMatches = React.lazy(() => import('./pages/admin/AdminMatches').then(m => ({ default: m.AdminMatches })));
const AdminMatchDetail = React.lazy(() => import('./pages/admin/AdminMatchDetail').then(m => ({ default: m.AdminMatchDetail })));
const AdminTransactions = React.lazy(() => import('./pages/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const AdminGames = React.lazy(() => import('./pages/admin/AdminGames').then(m => ({ default: m.AdminGames })));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminDisputes = React.lazy(() => import('./pages/admin/AdminDisputes').then(m => ({ default: m.AdminDisputes })));
const AdminDisputeDetail = React.lazy(() => import('./pages/admin/AdminDisputeDetail').then(m => ({ default: m.AdminDisputeDetail })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminPaymentMethods = React.lazy(() => import('./pages/admin/AdminPaymentMethods').then(m => ({ default: m.AdminPaymentMethods })));

const AdminSuspenseFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#6C5CE7] mb-4" />
      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Admin Module...</p>
    </div>
  </div>
);

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth type="login" />} />
            <Route path="/register" element={<Auth type="register" />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/matchmaking" element={<Matchmaking />} />
              <Route path="/match/:id" element={<Match />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Route>
            
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminDashboard /></Suspense>
              } />
              <Route path="/admin/users" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminUsers /></Suspense>
              } />
              <Route path="/admin/users/:id" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminUserDetail /></Suspense>
              } />
              <Route path="/admin/matches" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminMatches /></Suspense>
              } />
              <Route path="/admin/matches/:id" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminMatchDetail /></Suspense>
              } />
              <Route path="/admin/transactions" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminTransactions /></Suspense>
              } />
              <Route path="/admin/settings" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminSettings /></Suspense>
              } />
              <Route path="/admin/payment-methods" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminPaymentMethods /></Suspense>
              } />
              <Route path="/admin/games" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminGames /></Suspense>
              } />
              <Route path="/admin/audit-logs" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminAuditLogs /></Suspense>
              } />
              <Route path="/admin/disputes" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminDisputes /></Suspense>
              } />
              <Route path="/admin/disputes/:id" element={
                <Suspense fallback={<AdminSuspenseFallback />}><AdminDisputeDetail /></Suspense>
              } />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
