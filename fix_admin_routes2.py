import re

with open('src/backend/routes/adminRoutes.ts', 'r') as f:
    c = f.read()

# Just remove all the duplicate stakes and requireAuth
c = re.sub(r"router\.post\('/stakes'.*;\n", "", c)
c = re.sub(r"router\.post\('/stakes/:id/toggle'.*;\n", "", c)

c = c.replace(
    "export default router;",
    "router.post('/stakes', adminController.addStake);\nrouter.post('/stakes/:id/toggle', adminController.toggleStakeStatus);\nexport default router;"
)

with open('src/backend/routes/adminRoutes.ts', 'w') as f:
    f.write(c)
