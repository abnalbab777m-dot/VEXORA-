with open('src/backend/routes/adminRoutes.ts', 'r') as f:
    c = f.read()

c = c.replace("requireAuth, requireAdmin, ", "")

with open('src/backend/routes/adminRoutes.ts', 'w') as f:
    f.write(c)
