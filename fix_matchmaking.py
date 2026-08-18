import re
with open('src/pages/Matchmaking.tsx', 'r') as f:
    c = f.read()

target_err = """          {status === 'ERROR' && (
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/50">
                 <X className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Matchmaking Failed</h2>
               <p className="text-red-400 mb-6">{errorMsg}</p>
               <button onClick={() => navigate('/games')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                 Go Back
               </button>
             </div>
          )}"""

replacement_err = """          {status === 'ERROR' && (
             <div className="flex flex-col items-center">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-red-500/20 text-red-500 border-red-500/50'}`}>
                 <X className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Matchmaking {errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'Unavailable' : 'Failed'}</h2>
               <p className={`${errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'text-yellow-500' : 'text-red-400'} mb-6`}>{errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'Matchmaking is disabled in Demo Mode as it requires a database.' : errorMsg}</p>
               <button onClick={() => navigate('/games')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                 Go Back
               </button>
             </div>
          )}"""

c = c.replace(target_err, replacement_err)

with open('src/pages/Matchmaking.tsx', 'w') as f:
    f.write(c)
