with open('src/pages/Games.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    'className={}',
    'className={`p-8 border rounded-2xl max-w-2xl mx-auto ${isDemo ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-red-500/10 border-red-500/50 text-red-500"}`}'
)

with open('src/pages/Games.tsx', 'w') as f:
    f.write(c)
