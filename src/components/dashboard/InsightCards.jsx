import { motion } from 'framer-motion'
import { Lightbulb, Info, AlertTriangle, Fingerprint } from 'lucide-react'

export function SkinFactCard() {
  return (
    <div className="bg-accent-lavender/10 rounded-[1.5rem] p-6 border border-accent-lavender/20 mt-6 group">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
         <Lightbulb className="text-accent-lavender" size={20} />
      </div>
      
      <div>
        <h3 className="font-serif text-lg font-bold text-text mb-2 text-accent-lavender-dark">Did you know?</h3>
        <p className="text-sm font-medium text-text-muted leading-relaxed">
          Using too many active ingredients together can damage your skin barrier. Always patch test new products.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-accent-lavender/20">
         <button className="text-[11px] font-black uppercase tracking-widest text-accent-lavender-dark hover:text-black transition-all">
            See more tips
         </button>
      </div>
    </div>
  )
}

export function InsightsCard({ insights = [], skinProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[2rem] p-8 border border-white/60 shadow-sm space-y-6"
    >
      <div className="flex items-center gap-2">
        <Fingerprint className="text-accent-teal" size={20} />
        <h3 className="font-serif text-xl font-bold text-text">Insights for you</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div 
            key={i} 
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              insight.type === 'warning' 
                ? 'bg-red-50 border-red-100 text-red-900' 
                : 'bg-accent-teal/5 border-accent-teal/10 text-teal-900'
            }`}
          >
            {insight.type === 'warning' ? <AlertTriangle className="shrink-0" size={18} /> : <Info className="shrink-0" size={18} />}
            <span className="text-sm font-bold leading-snug">{insight.text}</span>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <div className="bg-bg-warm/30 rounded-[1.5rem] p-5 border border-border/10">
           <p className="text-[11px] font-black uppercase tracking-widest text-text-muted/40 mb-3">Skin Profile</p>
           <div className="flex flex-wrap gap-2">
              {skinProfile?.skinType && (
                <span className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-primary shadow-sm border border-primary/10">
                  {skinProfile.skinType} Type
                </span>
              )}
              {skinProfile?.concerns?.slice(0, 2).map((concern, i) => (
                <span key={i} className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-accent-lavender-dark shadow-sm border border-accent-lavender/10">
                  {concern}
                </span>
              ))}
              {skinProfile?.reactivity && skinProfile.reactivity !== 'Rarely reacts' && (
                <span className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-accent-teal-dark shadow-sm border border-accent-teal/10">
                  {skinProfile.reactivity}
                </span>
              )}
           </div>
        </div>
      </div>

      <SkinFactCard />
    </motion.div>
  )
}
