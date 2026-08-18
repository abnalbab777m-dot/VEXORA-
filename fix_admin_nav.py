with open('src/components/AdminNavigation.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    "{ to: '/admin/games', label: 'Games', icon: Gamepad2 },",
    "{ to: '/admin/games', label: 'Games', icon: Gamepad2 },\n    { to: '/admin/settings', label: 'Settings', icon: DollarSign },"
)

with open('src/components/AdminNavigation.tsx', 'w') as f:
    f.write(c)
