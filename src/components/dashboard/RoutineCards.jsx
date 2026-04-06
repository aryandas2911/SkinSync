import { motion } from 'framer-motion'
import { ShieldCheck, AlertCircle, Sunrise, Moon, Plus, Edit3 } from 'lucide-react'

export function SafetyScoreCard({ score = 0, status, hasRoutine = false, isLoading = false, onViewSummary }) {
  const getStatusColor = () => {
    if (score >= 80) return 'text-primary'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStatusLabel = () => {
    if (status) return status
    if (score >= 80) return 'Safe'
    if (score >= 60) return 'Moderate'
    return 'Risky'
  }

  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[2rem] p-8 border border-white/60 shadow-sm flex flex-col items-center justify-center text-center group"
    >
      <header className="w-full mb-6">
        <h3 className="font-serif text-xl font-bold text-text">Routine Safety</h3>
      </header>
      
      {hasRoutine ? (
        <>
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="40"
                fill="transparent"
                stroke="#F0EFEA"
                strokeWidth="10"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={getStatusColor()}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
               {isLoading ? (
                 <motion.div 
                   animate={{ opacity: [0.3, 0.6, 0.3] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                   className="text-xs font-black uppercase tracking-widest text-text-muted"
                 >
                   Analyzing...
                 </motion.div>
               ) : (
                 <>
                   <span className="text-2xl font-serif font-black text-text">{score}%</span>
                 </>
               )}
            </div>
          </div>

          <div className="w-full">
            <button 
              onClick={onViewSummary}
              disabled={isLoading}
              className="w-full py-3 text-sm font-bold text-text-muted hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
               View full routine summary
            </button>
          </div>
        </>
      ) : (
        <div className="py-8 space-y-5 w-full">
          <div className="w-20 h-20 bg-bg-warm rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="text-text-muted/20" size={36} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-text-muted/60">No routine set up yet</p>
            <p className="text-xs text-text-muted/40 max-w-[200px] mx-auto leading-relaxed">
              Add products to your morning and night routine to get a safety score.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}


export function DailyRoutineCard({ morning = [], night = [], onEdit, onAddProduct }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[2rem] p-8 border border-white/60 shadow-sm space-y-8"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-text">Your Routine</h3>
        <button 
          onClick={onEdit}
          className="p-2 bg-bg-warm/50 text-text-muted hover:text-primary rounded-xl transition-all"
        >
           <Edit3 size={18} />
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sunrise className="text-primary" size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-text-muted">Morning</span>
          </div>
          <div className="space-y-3">
             {morning.length > 0 ? morning.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-bg-warm/30 rounded-2xl border border-border/10">
                   <span className="text-sm font-bold text-text">{product.productName || product}</span>
                   <span className="text-[10px] font-black uppercase tracking-tighter text-text-muted/60">AM</span>
                </div>
             )) : (
                <button 
                  onClick={() => onAddProduct && onAddProduct('Morning')}
                  className="w-full py-4 border-2 border-dashed border-border/40 rounded-2xl text-text-muted/40 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                >
                   <Plus size={16} /> Add Product
                </button>
             )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Moon className="text-accent-lavender" size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-text-muted">Night</span>
          </div>
          <div className="space-y-3">
             {night.length > 0 ? night.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-bg-warm/30 rounded-2xl border border-border/10">
                   <span className="text-sm font-bold text-text">{product.productName || product}</span>
                   <span className="text-[10px] font-black uppercase tracking-tighter text-text-muted/60">PM</span>
                </div>
             )) : (
                <button 
                  onClick={() => onAddProduct && onAddProduct('Night')}
                  className="w-full py-4 border-2 border-dashed border-border/40 rounded-2xl text-text-muted/40 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                >
                   <Plus size={16} /> Add Product
                </button>
             )}
          </div>
        </section>
      </div>
    </motion.div>
  )
}
