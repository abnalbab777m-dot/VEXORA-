import re

with open('src/backend/routes/adminRoutes.ts', 'r') as f:
    c = f.read()

# We might not even need requireAuth explicitly on the routes if they are under a router that has requireAdmin which implies auth or if we just use requireAdmin. Wait, the original code had:
# const router = Router();
# // Apply requireAdmin to all routes in this router
# router.use(requireAdmin);
# 
# Wait, I previously changed the routes to:
# router.post('/stakes', adminController.addStake);

c = c.replace(
    "router.post('/stakes', adminController.addStake);",
    "router.post('/stakes', adminController.addStake);"
)

with open('src/backend/routes/adminRoutes.ts', 'w') as f:
    f.write(c)
