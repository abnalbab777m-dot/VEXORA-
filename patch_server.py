import re

with open('server.ts', 'r') as f:
    c = f.read()

import_str = """import adminRoutes from './src/backend/routes/adminRoutes';
import statisticsRoutes from './src/backend/routes/statisticsRoutes';
import friendRoutes from './src/backend/routes/friendRoutes';
import notificationRoutes from './src/backend/routes/notificationRoutes';"""

c = c.replace("import adminRoutes from './src/backend/routes/adminRoutes';\nimport statisticsRoutes from './src/backend/routes/statisticsRoutes';", import_str)

route_str = """  app.use('/api/admin', adminRoutes);
  app.use('/api', statisticsRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/notifications', notificationRoutes);"""

c = c.replace("  app.use('/api/admin', adminRoutes);\n  app.use('/api', statisticsRoutes);", route_str)

with open('server.ts', 'w') as f:
    f.write(c)
