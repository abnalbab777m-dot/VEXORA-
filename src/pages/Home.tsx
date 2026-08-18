import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Swords, ShieldCheck, ChevronRight, Zap, User } from 'lucide-react';

export function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6C5CE7]/20 via-[#070B14] to-[#070B14]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Zap className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-sm font-medium tracking-wide text-gray-300">THE PREMIER COMPETITIVE PLATFORM</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6">
              PLAY. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C5CE7] to-[#00D4FF]">COMPETE.</span> WIN.
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of players in real-money tournaments and head-to-head matches. Put your skills to the ultimate test in eFootball and Jawaker.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/games" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                Start Playing <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-[#0F1624] border border-white/10 text-white font-bold rounded-lg hover:bg-white/5 transition-colors">
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-[#0F1624]/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">Your path to glory in 5 simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { num: '01', title: 'Choose Game', desc: 'Select eFootball or Jawaker' },
              { num: '02', title: 'Set Stake', desc: 'Pick your entry fee amount' },
              { num: '03', title: 'Match', desc: 'Our system finds an opponent' },
              { num: '04', title: 'Play', desc: 'Compete in the actual game' },
              { num: '05', title: 'Win', desc: 'Report results and get paid' }
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-[#0F1624] border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#6C5CE7] transition-colors relative z-10 shadow-lg">
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#6C5CE7] to-[#00D4FF]">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
                {i < 4 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-white/10 to-transparent"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Games */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Supported Games</h2>
              <p className="text-gray-400">Compete in the most popular titles</p>
            </div>
            <Link to="/games" className="hidden sm:flex text-[#00D4FF] hover:text-white items-center gap-1 font-semibold transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: 'eFootball', img: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80', active: true },
              { name: 'Jawaker', img: 'https://images.unsplash.com/photo-1611032549110-3ef0ff328b97?w=800&q=80', active: true }
            ].map((game, i) => (
              <Link to="/games" key={i} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0F1624] aspect-video">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
                <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end bg-gradient-to-t from-[#070B14] to-transparent">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl font-bold mb-2">{game.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]"></span>
                        <span className="text-sm font-medium text-gray-300">Live Matchmaking</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                      <Swords className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Players', value: '10K+', icon: User },
              { label: 'Matches Played', value: '250K+', icon: Swords },
              { label: 'Total Paid Out', value: '$1.2M+', icon: Trophy },
              { label: 'Secure Platform', value: '100%', icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#0F1624] border border-white/10 flex items-center justify-center mb-4">
                  <stat.icon className="w-6 h-6 text-[#6C5CE7]" />
                </div>
                <h4 className="text-3xl font-black mb-1">{stat.value}</h4>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
