import re

with open('server.ts', 'r') as f:
    c = f.read()

import_str = """import gameInvitationRoutes from './src/backend/routes/gameInvitationRoutes';\n"""

c = c.replace("import friendRoutes from './src/backend/routes/friendRoutes';", import_str + "import friendRoutes from './src/backend/routes/friendRoutes';")

route_str = """  app.use('/api/invitations', gameInvitationRoutes);\n"""

c = c.replace("  app.use('/api/friends', friendRoutes);", route_str + "  app.use('/api/friends', friendRoutes);")

with open('server.ts', 'w') as f:
    f.write(c)
