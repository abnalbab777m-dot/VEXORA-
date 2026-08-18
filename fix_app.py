with open('src/App.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    "const AdminDisputeDetail = React.lazy(() => import('./pages/admin/AdminDisputeDetail').then(m => ({ default: m.AdminDisputeDetail })));",
    "const AdminDisputeDetail = React.lazy(() => import('./pages/admin/AdminDisputeDetail').then(m => ({ default: m.AdminDisputeDetail })));\nconst AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));"
)

c = c.replace(
    '<Route path="/admin/games" element={',
    '<Route path="/admin/settings" element={\n                <Suspense fallback={<AdminSuspenseFallback />}><AdminSettings /></Suspense>\n              } />\n              <Route path="/admin/games" element={'
)

with open('src/App.tsx', 'w') as f:
    f.write(c)
