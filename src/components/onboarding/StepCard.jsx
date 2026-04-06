import { motion, AnimatePresence } from 'framer-motion'
import NavigationButtons from './NavigationButtons'

export default function StepCard({ 
  title, 
  subtitle, 
  children, 
  onBack, 
  onNext, 
  isNextDisabled, 
  isFirstStep, 
  isLastStep,
  stepKey 
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-white/60 p-10 md:p-14 relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-teal/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center">
        <header className="mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-3xl md:text-4xl font-bold text-text mb-4"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-text-muted text-base font-medium"
          >
            {subtitle || "This helps us personalize your results"}
          </motion.p>
        </header>

        <div className="min-h-[200px] flex flex-col items-center justify-center w-full">
           {children}
        </div>

        <NavigationButtons 
          onBack={onBack} 
          onNext={onNext} 
          isNextDisabled={isNextDisabled}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      </div>
    </motion.div>
  )
}
