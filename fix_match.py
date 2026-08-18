import re
with open('src/pages/Match.tsx', 'r') as f:
    c = f.read()

target_err = """  if (errorMsg) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#0F1624] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/50">
             <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Match Error</h2>
          <p className="text-red-400 mb-6">{errorMsg}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }"""

replacement_err = """  if (errorMsg) {
    const isDemo = errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured');
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#0F1624] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isDemo ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-red-500/20 text-red-500 border-red-500/50'}`}>
             <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{isDemo ? 'Match Unavailable' : 'Match Error'}</h2>
          <p className={`${isDemo ? 'text-yellow-500' : 'text-red-400'} mb-6`}>{isDemo ? 'Matches cannot be loaded in Demo Mode.' : errorMsg}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }"""

c = c.replace(target_err, replacement_err)

with open('src/pages/Match.tsx', 'w') as f:
    f.write(c)
