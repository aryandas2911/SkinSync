import { motion } from 'framer-motion'
import { GitCompareArrows, Sparkles, ArrowRight } from 'lucide-react'

export default function CompareSection({ scanCount = 0, onCompare }) {
  const hasEnoughScans = scanCount >= 2

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden bg-white rounded-[2rem] p-8 border border-white/60 shadow-sm group h-full"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <GitCompareArrows className="text-text-muted" size={18} />
          <h3 className="font-serif text-xl font-bold text-text">Compare Products</h3>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center space-y-5">
          <p className="text-sm text-text-muted font-medium leading-relaxed">
            Compare two scanned products side-by-side to see which one suits your skin better.
          </p>

          {/* A vs B visual */}
          <div className="flex items-center justify-center gap-3 py-4">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10 flex flex-col items-center justify-center gap-1.5"
            >
              <span className="text-sm font-black text-primary">A</span>
              <div className="w-8 h-1 bg-primary/15 rounded-full" />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 bg-accent-teal/15 rounded-full flex items-center justify-center border border-accent-teal/20"
            >
              <span className="text-[10px] font-black text-accent-teal">VS</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="w-16 h-20 bg-gradient-to-br from-accent-teal/10 to-accent-teal/5 rounded-xl border border-accent-teal/10 flex flex-col items-center justify-center gap-1.5"
            >
              <span className="text-sm font-black text-accent-teal-dark">B</span>
              <div className="w-8 h-1 bg-accent-teal/15 rounded-full" />
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          {hasEnoughScans ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCompare}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-[0_15px_30px_rgba(79,125,243,0.25)] hover:shadow-[0_20px_40px_rgba(79,125,243,0.35)] transition-all"
            >
              <GitCompareArrows size={18} />
              Compare Now
              <ArrowRight size={14} />
            </motion.button>
          ) : (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
              <p className="text-[11px] font-bold text-primary/80">
                Scan at least 2 products to compare them
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
