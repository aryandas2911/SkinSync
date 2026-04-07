import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className={`relative w-full ${sizes[size]} max-h-[calc(100vh-3rem)] bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden flex flex-col`}
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
               <h3 className="font-serif text-2xl font-bold text-text">{title}</h3>
               <button 
                 onClick={onClose}
                 className="p-2.5 bg-bg-warm/50 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
               >
                  <X size={20} />
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
