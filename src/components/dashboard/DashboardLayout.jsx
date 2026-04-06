import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import DashboardNavbar from './DashboardNavbar'
import HeroScanCard from './HeroScanCard'
import { SafetyScoreCard, DailyRoutineCard } from './RoutineCards'
import ScanHistoryCard from './ScanHistoryCard'
import { SkinFactCard, InsightsCard } from './InsightCards'
import FloatingChatbot from './FloatingChatbot'

// Modals
import SettingsModal from '../modals/SettingsModal'
import CameraModal from '../modals/CameraModal'
import UploadModal from '../modals/UploadModal'
import RoutineModal from '../modals/RoutineModal'
import AddProductModal from '../modals/AddProductModal'
import RoutineSummaryModal from '../modals/RoutineSummaryModal'

import { generateRoutineReport } from '../../ai/compatibilityLLM'

import { db } from '../../utils/db'
import { storage } from '../../utils/storage'

export default function DashboardLayout({ onboardingComplete = false, onCompleteOnboarding, onLogout, onDeleteAccount, onNavigate, onStartAnalysis }) {
  const [activeModals, setActiveModals] = useState({
    settings: false,
    camera: false,
    upload: false,
    routine: false,
    addProduct: false,
    routineSummary: false
  })
  
  const [morning, setMorning] = useState([])
  const [night, setNight] = useState([])
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState({ totalScans: 0, weeklyScans: 0 })
  const [userProfile, setUserProfile] = useState(storage.getUser())
  const [addSection, setAddSection] = useState('Morning')
  
  const [routineAnalysis, setRoutineAnalysis] = useState(null)
  const [isAnalyzingRoutine, setIsAnalyzingRoutine] = useState(false)

  useEffect(() => {
    const loadDashboardData = async () => {
      setUserProfile(storage.getUser())
      const recentScans = await db.getAllScans()
      setScans(recentScans.slice(0, 5))

      const currentRoutine = await db.getRoutine()
      setMorning(currentRoutine.morning || [])
      setNight(currentRoutine.night || [])
      setRoutineAnalysis(currentRoutine.analysis || null)

      const currentStats = await db.getStats()
      setStats(currentStats)
      
      // If we have a routine but no analysis, trigger one
      if ((currentRoutine.morning?.length || currentRoutine.night?.length) && !currentRoutine.analysis) {
        triggerRoutineAnalysis(currentRoutine.morning, currentRoutine.night)
      }
    }
    loadDashboardData()
  }, [])

  const generateDynamicInsights = (profile) => {
    if (!profile) return []
    const insights = []
    
    // Skin Type Based
    if (profile.skinType === 'Dry') {
      insights.push({ 
        type: 'info', 
        text: "Your dry skin needs barrier-supportive ingredients like Ceramides and Hyaluronic Acid." 
      })
    } else if (profile.skinType === 'Oily') {
      insights.push({ 
        type: 'info', 
        text: "For oily skin, look for 'Non-Comedogenic' labels to avoid clogging pores." 
      })
    }

    // Sensitivity Based
    if (profile.sensitivities?.includes('Fragrance')) {
      insights.push({ 
        type: 'warning', 
        text: "Since you're sensitive to fragrance, we'll flag Linalool and Limonene in your scans." 
      })
    }
    if (profile.sensitivities?.includes('Alcohol')) {
      insights.push({ 
        type: 'warning', 
        text: "Alcohol sensitivity detected: We prioritize flagging Ethanol and Alcohol Denat for you." 
      })
    }

    // Actives Based
    if (profile.actives?.some(a => a.includes('Retinol') || a.includes('AHA') || a.includes('BHA'))) {
      insights.push({ 
        type: 'info', 
        text: "Active exfoliants/retinoids detected: A high-SPF sunscreen is mandatory in your AM routine." 
      })
    }

    // Generic fallback if no specific insights
    if (insights.length === 0) {
      insights.push({ 
        type: 'info', 
        text: "Start scanning products to see how they match your unique skin profile." 
      })
    }

    return insights.slice(0, 3) // Keep it concise
  }

  const triggerRoutineAnalysis = async (m, n) => {
    if ((!m || m.length === 0) && (!n || n.length === 0)) {
      setRoutineAnalysis(null)
      await db.updateRoutine({ morning: m, night: n, analysis: null })
      return
    }

    setIsAnalyzingRoutine(true)
    try {
      // Always get FRESH profile for analysis
      const freshProfile = storage.getUser()?.skinProfile || {}
      const allScans = await db.getAllScans()
      
      // Gather ingredients for all products in the routine
      const fetchIngredients = async (items) => {
        return Promise.all((items || []).map(async (p) => {
          // HEAL: If product is just a string (legacy data), try to find a matching scan
          let result = null;
          if (typeof p === 'string') {
            const match = allScans.find(s => s.productName === p)
            if (match && match.resultId) {
              result = await db.getResult(match.resultId)
            }
            return { 
              productName: p, 
              ingredients: result?.ingredients?.map(i => i.name) || [],
              score: result?.score || 100,
              verdict: result?.verdict || 'Safe'
            }
          }

          // Modern object structure
          if (!p.resultId) return { productName: p.productName, ingredients: [], score: 100, verdict: 'Safe' }
          result = await db.getResult(p.resultId)
          return {
            productName: p.productName,
            ingredients: result?.ingredients?.map(i => i.name) || [],
            score: result?.score || 100,
            verdict: result?.verdict || 'Safe'
          }
        }))
      }

      console.log('AI Routine Engine: Starting clinical analysis for morning/night batches...');
      const morningFull = await fetchIngredients(m)
      const nightFull = await fetchIngredients(n)

      console.log('AI Routine Engine: Analyzing prompt for', freshProfile.skinType, 'skin...');
      const analysis = await generateRoutineReport(
        { morning: morningFull, night: nightFull },
        freshProfile
      )

      setRoutineAnalysis(analysis)
      await db.updateRoutine({ morning: m, night: n, analysis })
    } catch (err) {
      console.error('Routine Analysis failed:', err)
    } finally {
      setIsAnalyzingRoutine(false)
    }
  }

  const toggleModal = (modal, isOpen) => {
    setActiveModals(prev => ({ ...prev, [modal]: isOpen }))
  }

  const handleSettingsAction = (id) => {
    if (id === 'logout') onLogout()
    if (id === 'delete-account') onDeleteAccount()
    if (id === 'edit-profile') onCompleteOnboarding()
    toggleModal('settings', false)
  }

  const handleNewScan = (id) => {
    // Navigate to results
    if (onStartAnalysis) onStartAnalysis(id)
  }

  const handleDeleteScan = async (id) => {
    if (window.confirm('Delete this scan? This action cannot be undone.')) {
      await db.deleteScan(id);
      const recentScans = await db.getAllScans()
      setScans(recentScans.slice(0, 5))
      const currentStats = await db.getStats()
      setStats(currentStats)
    }
  }

  const handleUpdateRoutine = async (m, n) => {
    setMorning(m)
    setNight(n)
    await db.updateRoutine({ morning: m, night: n, analysis: routineAnalysis })
    triggerRoutineAnalysis(m, n)
  }

  const handleAddProduct = async (product) => {
    const productObj = {
      id: crypto.randomUUID(),
      productName: product.productName,
      resultId: product.resultId
    }

    const newMorning = addSection === 'Morning' ? [...morning, productObj] : morning
    const newNight = addSection === 'Night' ? [...night, productObj] : night
    
    setMorning(newMorning)
    setNight(newNight)
    await db.updateRoutine({ morning: newMorning, night: newNight, analysis: routineAnalysis })
    triggerRoutineAnalysis(newMorning, newNight)
    toggleModal('addProduct', false)
  }

  const handleOpenAddProduct = (section) => {
    setAddSection(section)
    toggleModal('addProduct', true)
  }

  if (!onboardingComplete) {
    return (
       <div className="min-h-screen bg-[#F7F6F3] flex flex-col">
          <DashboardNavbar onLogout={onLogout} onNavigate={onNavigate} />
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-md space-y-8"
             >
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                   <ShieldCheck className="text-primary" size={40} />
                </div>
                
                <div className="space-y-4">
                  <h1 className="font-serif text-4xl md:text-5xl font-bold text-text">
                    Hello, {userProfile?.userName || 'there'} 👋
                  </h1>
                  <p className="text-text-muted text-lg font-medium">
                    Let's get to know your skin before we begin.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCompleteOnboarding}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm shadow-[0_20px_40px_rgba(79,125,243,0.3)] flex items-center justify-center gap-3 hover:bg-black transition-all"
                >
                  Complete onboarding
                  <ArrowRight size={18} />
                </motion.button>
             </motion.div>
          </div>
       </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-20">
      <DashboardNavbar 
        onLogout={onLogout} 
        onNavigate={onNavigate} 
        onOpenSettings={() => toggleModal('settings', true)}
      />
      
      <main className="max-w-7xl mx-auto pt-32 px-6 md:px-8 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-serif text-4xl md:text-5xl font-bold text-text"
            >
              Welcome back, {userProfile?.userName || 'there'} 👋
            </motion.h1>
            <p className="text-text-muted font-medium text-lg">
              You've scanned {stats.totalScans} products so far.
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal/10 border border-accent-teal/20 rounded-full"
          >
            <div className="w-2 h-2 bg-accent-teal rounded-full animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-accent-teal-dark">{userProfile?.skinProfile?.skinType || 'Active'} skin profile</span>
          </motion.div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
             <HeroScanCard 
               onScan={() => toggleModal('camera', true)}
               onUpload={() => toggleModal('upload', true)}
             />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DailyRoutineCard 
                   morning={morning}
                   night={night}
                   onEdit={() => toggleModal('routine', true)}
                   onAddProduct={handleOpenAddProduct}
                 />
                <ScanHistoryCard 
                   scans={scans} 
                   onSelect={(id) => onStartAnalysis && onStartAnalysis(id)} 
                   onDelete={handleDeleteScan}
                 />
             </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
             <SafetyScoreCard 
               score={routineAnalysis?.score || 0} 
               status={routineAnalysis?.verdict}
               hasRoutine={morning.length + night.length > 0} 
               isLoading={isAnalyzingRoutine}
               onViewSummary={() => toggleModal('routineSummary', true)}
             />
              <InsightsCard 
                insights={generateDynamicInsights(userProfile?.skinProfile)} 
                skinProfile={userProfile?.skinProfile} 
              /> 
          </div>
        </div>
      </main>

      {/* Modals Container */}
      <SettingsModal 
        isOpen={activeModals.settings} 
        onClose={() => toggleModal('settings', false)}
        onAction={handleSettingsAction}
      />
      
      <CameraModal 
        isOpen={activeModals.camera} 
        onClose={() => toggleModal('camera', false)}
        onCapture={handleNewScan}
      />

      <UploadModal 
        isOpen={activeModals.upload} 
        onClose={() => toggleModal('upload', false)}
        onUpload={handleNewScan}
      />

      <RoutineModal 
        isOpen={activeModals.routine} 
        onClose={() => toggleModal('routine', false)}
        morningProducts={morning}
        nightProducts={night}
        onUpdateRoutine={handleUpdateRoutine}
        onOpenAddModal={handleOpenAddProduct}
      />

      <AddProductModal 
        isOpen={activeModals.addProduct} 
        onClose={() => toggleModal('addProduct', false)}
        scannedProducts={scans}
        onAdd={handleAddProduct}
      />

      <RoutineSummaryModal 
        isOpen={activeModals.routineSummary}
        onClose={() => toggleModal('routineSummary', false)}
        analysis={routineAnalysis}
      />

      <FloatingChatbot userProfile={userProfile} />
    </div>
  )
}
