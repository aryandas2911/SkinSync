import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitCompareArrows, ChevronDown, Trophy, Sparkles, Brain,
  Shield, AlertTriangle, XCircle, ChevronRight, Loader2
} from 'lucide-react'
import Modal from './Modal'
import { db } from '../../utils/db'
import { generateComparisonInsight } from '../../ai/compatibilityLLM'

// Verdict color mapping
const verdictConfig = {
  'Safe': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', ring: 'stroke-green-500', Icon: Shield },
  'Mostly Safe': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', ring: 'stroke-green-400', Icon: Shield },
  'Use with Caution': { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', ring: 'stroke-yellow-500', Icon: AlertTriangle },
  'Caution': { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', ring: 'stroke-yellow-500', Icon: AlertTriangle },
  'Avoid': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'stroke-red-500', Icon: XCircle },
}

const getVerdictConfig = (verdict) => verdictConfig[verdict] || verdictConfig['Safe']

// Score Ring SVG
function ScoreRing({ score, size = 72, strokeWidth = 5, verdict }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const config = getVerdictConfig(verdict)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/20"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={config.ring}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black text-text">{score}</span>
      </div>
    </div>
  )
}

// Dropdown selector
function ProductSelector({ label, value, onChange, options, disabledValue }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.id === value)

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <label className="block text-[11px] font-black uppercase tracking-widest text-text-muted/60 mb-2">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-5 py-4 rounded-2xl border text-left transition-all ${open
            ? 'border-primary/40 bg-white shadow-md'
            : 'border-border/10 bg-bg-warm/30 hover:bg-bg-warm/50'
          }`}
      >
        <span className={`text-sm font-bold truncate ${selected ? 'text-text' : 'text-text-muted/50'}`}>
          {selected ? selected.productName : `Select product...`}
        </span>
        <ChevronDown size={16} className={`text-text-muted/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-border/10 shadow-xl max-h-56 overflow-y-auto custom-scrollbar"
          >
            {options.map((scan) => {
              const isDisabled = scan.id === disabledValue
              return (
                <button
                  key={scan.id}
                  disabled={isDisabled}
                  onClick={() => { onChange(scan.id); setOpen(false) }}
                  className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all flex items-center gap-3 ${isDisabled
                      ? 'text-text-muted/30 cursor-not-allowed bg-bg-warm/20'
                      : scan.id === value
                        ? 'bg-primary/5 text-primary'
                        : 'text-text hover:bg-bg-warm/30'
                    }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${!scan.status || scan.status === 'safe' ? 'bg-green-400' :
                      scan.status === 'moderate' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                  <span className="truncate">{scan.productName}</span>
                  {isDisabled && <span className="text-[10px] uppercase tracking-wider text-text-muted/40 ml-auto shrink-0">Selected</span>}
                </button>
              )
            })}
            {options.length === 0 && (
              <div className="px-5 py-4 text-sm text-text-muted/50 text-center">No scanned products</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Product comparison card
function ProductCard({ product, result, isBetter }) {
  const [showAll, setShowAll] = useState(false)
  const config = getVerdictConfig(result?.verdict)
  const VerdictIcon = config.Icon
  const ingredients = result?.ingredients || []
  const visibleIngredients = showAll ? ingredients : ingredients.slice(0, 6)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex-1 min-w-0 bg-white rounded-[1.5rem] border p-5 transition-all ${isBetter
          ? 'border-green-200 shadow-[0_0_30px_rgba(74,222,128,0.12)]'
          : 'border-border/10 shadow-sm'
        }`}
    >
      {/* Better Match Badge */}
      {isBetter && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg">
            <Trophy size={12} />
            Better Match
          </div>
        </motion.div>
      )}

      <div className="flex flex-col items-center text-center space-y-3">
        {/* Score Ring */}
        <ScoreRing score={result?.score || 0} verdict={result?.verdict} />

        {/* Product Name */}
        <h4 className="font-serif text-base font-bold text-text leading-tight">{product.productName}</h4>

        {/* Verdict Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
          <VerdictIcon size={13} className={config.color} />
          <span className={`text-[11px] font-black uppercase tracking-widest ${config.color}`}>
            {result?.verdict || 'Unknown'}
          </span>
        </div>

        {/* Ingredients List */}
        <div className="w-full pt-3 border-t border-border/10">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-2 text-left">
            Ingredients ({ingredients.length})
          </h5>
          <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar text-left">
            {visibleIngredients.map((ing, i) => {
              const name = typeof ing === 'string' ? ing : ing.name
              const risk = typeof ing === 'string' ? 'low' : (ing.risk || 'low')
              return (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${risk === 'high' ? 'bg-red-400' : risk === 'moderate' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                  <span className="text-xs font-medium text-text-muted truncate capitalize">{name}</span>
                </div>
              )
            })}
          </div>
          {ingredients.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              {showAll ? 'Show Less' : `View ${ingredients.length - 6} More`}
              <ChevronRight size={12} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Loading skeleton
function InsightSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-bg-warm rounded-xl" />
        <div className="h-5 bg-bg-warm rounded-lg w-48" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-bg-warm rounded-full w-full" />
        <div className="h-3 bg-bg-warm rounded-full w-5/6" />
        <div className="h-3 bg-bg-warm rounded-full w-4/6" />
      </div>
    </div>
  )
}

// ─── Main Modal ─────────────────────────────────────────────
export default function CompareModal({ isOpen, onClose, userProfile }) {
  const [allScans, setAllScans] = useState([])
  const [product1Id, setProduct1Id] = useState(null)
  const [product2Id, setProduct2Id] = useState(null)
  const [result1, setResult1] = useState(null)
  const [result2, setResult2] = useState(null)
  const [aiInsight, setAiInsight] = useState(null)
  const [isComparing, setIsComparing] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(false)

  // Cache: pairKey -> { insight, winner, reasons }
  const cacheRef = useRef(new Map())

  // Load all scans when modal opens
  useEffect(() => {
    if (isOpen) {
      db.getAllScans().then(scans => setAllScans(scans))
    }
  }, [isOpen])

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setProduct1Id(null)
      setProduct2Id(null)
      setResult1(null)
      setResult2(null)
      setAiInsight(null)
    }
  }, [isOpen])

  // Fetch result data when both products selected
  const fetchAndCompare = useCallback(async (id1, id2) => {
    if (!id1 || !id2 || id1 === id2) return

    setIsLoadingResults(true)
    setAiInsight(null)

    try {
      const scan1 = allScans.find(s => s.id === id1)
      const scan2 = allScans.find(s => s.id === id2)

      // Fetch full results from IndexedDB
      const [r1, r2] = await Promise.all([
        scan1?.resultId ? db.getResult(scan1.resultId) : null,
        scan2?.resultId ? db.getResult(scan2.resultId) : null,
      ])

      setResult1(r1)
      setResult2(r2)
      setIsLoadingResults(false)

      // Now generate AI insight
      if (r1 && r2 && scan1 && scan2) {
        const pairKey = [id1, id2].sort().join('_')
        const cached = cacheRef.current.get(pairKey)

        if (cached) {
          setAiInsight(cached)
        } else {
          setIsComparing(true)
          try {
            const profile = userProfile?.skinProfile || {}
            const p1Data = {
              productName: scan1.productName,
              score: r1.score || 0,
              verdict: r1.verdict || 'Unknown',
              ingredients: r1.ingredients || []
            }
            const p2Data = {
              productName: scan2.productName,
              score: r2.score || 0,
              verdict: r2.verdict || 'Unknown',
              ingredients: r2.ingredients || []
            }

            const insight = await generateComparisonInsight(p1Data, p2Data, profile)
            cacheRef.current.set(pairKey, insight)
            setAiInsight(insight)
          } catch (err) {
            console.error('Compare AI failed:', err)
          } finally {
            setIsComparing(false)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load comparison data:', err)
      setIsLoadingResults(false)
    }
  }, [allScans, userProfile])

  // Trigger comparison when both selections change
  useEffect(() => {
    if (product1Id && product2Id && product1Id !== product2Id) {
      fetchAndCompare(product1Id, product2Id)
    }
  }, [product1Id, product2Id, fetchAndCompare])

  const scan1 = allScans.find(s => s.id === product1Id)
  const scan2 = allScans.find(s => s.id === product2Id)

  const score1 = result1?.score || 0
  const score2 = result2?.score || 0
  const scoreDiff = Math.abs(score1 - score2)
  const isTie = scoreDiff < 5
  const winnerName = score1 >= score2 ? scan1?.productName : scan2?.productName
  const bothSelected = product1Id && product2Id && product1Id !== product2Id

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Products" size="xl">
      <div className="p-5 md:p-6 space-y-5">
        {/* ─── Product Selectors ─── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ProductSelector
            label="Product 1"
            value={product1Id}
            onChange={setProduct1Id}
            options={allScans}
            disabledValue={product2Id}
          />

          <div className="hidden sm:flex items-end pb-4">
            <div className="w-10 h-10 bg-bg-warm/50 rounded-full flex items-center justify-center border border-border/10">
              <GitCompareArrows size={16} className="text-text-muted/40" />
            </div>
          </div>

          <ProductSelector
            label="Product 2"
            value={product2Id}
            onChange={setProduct2Id}
            options={allScans}
            disabledValue={product1Id}
          />
        </div>

        {/* Duplicate selection warning */}
        {product1Id && product2Id && product1Id === product2Id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm font-bold text-yellow-700 text-center"
          >
            Please select two different products to compare
          </motion.div>
        )}

        {/* Loading results */}
        {isLoadingResults && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm font-bold text-text-muted">Loading product data...</span>
          </div>
        )}

        {/* ─── Comparison Cards ─── */}
        {bothSelected && result1 && result2 && !isLoadingResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Side-by-side cards */}
            <div className="flex flex-col md:flex-row gap-4">
              <ProductCard
                product={scan1}
                result={result1}
                isBetter={!isTie && score1 > score2}
              />
              <ProductCard
                product={scan2}
                result={result2}
                isBetter={!isTie && score2 > score1}
              />
            </div>



            {/* ─── Winner Breakdown ─── */}
            {(isComparing || aiInsight) && (
              <div className="bg-white rounded-[1.5rem] border border-border/10 p-4 md:p-5">


                {isComparing ? (
                  <InsightSkeleton />
                ) : aiInsight ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >


                    {/* Bullet reasons */}
                    {aiInsight.reasons?.length > 0 && (
                      <ul className="space-y-3">
                        {aiInsight.reasons.map((reason, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3"
                          >
                            <div className="mt-1 w-5 h-5 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <Sparkles size={10} className="text-primary" />
                            </div>
                            <span className="text-sm text-text-muted font-medium leading-relaxed">{reason}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ) : null}
              </div>
            )}
          </motion.div>
        )}

        {/* Initial state prompt */}
        {!bothSelected && !isLoadingResults && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-40">
            <GitCompareArrows size={36} strokeWidth={1.2} className="text-text-muted" />
            <p className="text-sm font-bold text-text-muted">Select two products above to start comparing</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
