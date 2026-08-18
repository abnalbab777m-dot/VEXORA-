import re
with open('src/pages/Games.tsx', 'r') as f:
    c = f.read()

target_err = """  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 w-full text-center">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tight">Select Game</h1>
        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg max-w-2xl mx-auto">
          {error}
        </div>
      </div>
    );
  }"""

replacement_err = """  if (error) {
    const isDemo = error.includes('Demo Mode') || error.includes('Database not configured');
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 w-full text-center">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tight">Select Game</h1>
        <div className={`p-8 border rounded-2xl max-w-2xl mx-auto ${isDemo ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
          <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">{isDemo ? 'Demo Mode Active' : 'Error Loading Games'}</h2>
          <p>{isDemo ? 'Games are currently unavailable because the database is not configured. Please set up the database to enable matchmaking.' : error}</p>
        </div>
      </div>
    );
  }"""

c = c.replace(target_err, replacement_err)

with open('src/pages/Games.tsx', 'w') as f:
    f.write(c)
