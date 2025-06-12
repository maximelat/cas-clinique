"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Brain, FileText, AlertCircle, ArrowLeft, Copy, ToggleLeft, ToggleRight, 
  Download, FileDown, Mic, MicOff, Pause, Play, ImagePlus, X, Lock, Coins, 
  Microscope, History, Settings, ChevronRight, ChevronDown, Camera, Info, 
  Search, BookOpen, Code, AlertTriangle, Calendar, Users, Pill, Maximize2, 
  CircleCheck, Eye, Plus, RefreshCw, GitBranch, Edit, ChevronUp, 
  ChevronLeft, Save, Loader2, Sparkles, CheckCircle, Trash2, Check, Lightbulb, 
  Globe, Calculator, Clock, FileSearch
} from "lucide-react"
import { toast } from "sonner"
import { AIClientService } from "@/services/ai-client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useAuth } from "@/contexts/AuthContext"
import { CreditsService } from "@/services/credits"
import { HistoryService } from "@/services/history"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'
import RareDiseaseResults from '@/components/RareDiseaseResults'

// Section titles configuration
const sectionTitles = {
  CLINICAL_CONTEXT: "1. Contexte clinique",
  KEY_DATA: "2. Données clés",
  DIAGNOSTIC_HYPOTHESES: "3. Hypothèses diagnostiques",
  COMPLEMENTARY_EXAMS: "4. Examens complémentaires recommandés",
  THERAPEUTIC_DECISIONS: "5. Décisions thérapeutiques",
  PROGNOSIS_FOLLOWUP: "6. Pronostic & suivi",
  PATIENT_EXPLANATIONS: "7. Explications au patient",
  RARE_DISEASES: "8. Recherche de maladies rares"
}

// Demo content
const demoSections = {
  CLINICAL_CONTEXT: `Patient de 65 ans, hypertendu connu, se présente aux urgences pour douleur thoracique oppressive rétrosternale survenue au repos il y a 2 heures. La douleur irradie vers le bras gauche et s'accompagne de sueurs profuses et de nausées. [1]

Antécédents : HTA traitée par IEC, dyslipidémie sous statine, tabagisme sevré il y a 5 ans (40 PA). Pas d'antécédent coronarien personnel, mais père décédé d'IDM à 58 ans. [2]`,
  
  KEY_DATA: `• Facteurs de risque cardiovasculaire : HTA, dyslipidémie, tabagisme sevré, hérédité coronarienne
• Présentation clinique : douleur thoracique typique avec signes végétatifs
• Constantes : PA 145/90 mmHg, FC 95/min, SpO2 96% AA
• ECG : sus-décalage ST en V1-V4 de 3mm
• Troponine T hs : 450 ng/L (N<14)`,
  
  DIAGNOSTIC_HYPOTHESES: `1. **Syndrome coronarien aigu ST+ antérieur** (haute probabilité)
   - Tableau clinique typique
   - Modifications ECG caractéristiques
   - Élévation significative de la troponine

2. Diagnostics différentiels à éliminer :
   - Dissection aortique (douleur différente, asymétrie tensionnelle)
   - Embolie pulmonaire (contexte différent, D-dimères)
   - Péricardite aiguë (frottement, modifications ECG diffuses) [3]`,
  
  COMPLEMENTARY_EXAMS: `Urgents :
• Coronarographie en urgence (< 90 min) avec angioplastie primaire si lésion coupable
• Échocardiographie pour évaluer la FEVG et rechercher des complications
• Bilan biologique : NFS, ionogramme, créatinine, glycémie, bilan lipidique complet

À distance :
• IRM cardiaque si doute sur la viabilité myocardique
• Test d'effort ou scintigraphie myocardique avant sortie [4]`,
  
  THERAPEUTIC_DECISIONS: `Traitement immédiat :
• Aspirine 250mg IV + Clopidogrel 600mg PO
• Héparine non fractionnée bolus 60 UI/kg puis 12 UI/kg/h
• Morphine titrée pour l'analgésie
• Dérivés nitrés si PA > 100 mmHg systolique
• Bêtabloquant (bisoprolol 2,5mg) si pas de contre-indication

Post-angioplastie :
• Double antiagrégation plaquettaire 12 mois
• IEC/ARA2, bêtabloquant, statine haute intensité
• Réadaptation cardiaque [5]`,
  
  PROGNOSIS_FOLLOWUP: `Pronostic :
• Favorable si revascularisation < 2h (mortalité < 5%)
• Risque de récidive à 1 an : 10-15% sans traitement optimal
• FEVG post-IDM déterminante pour le pronostic à long terme

Suivi :
• Consultation cardiologie à 1 mois, 3 mois puis tous les 6 mois
• Échocardiographie à 3 mois
• Surveillance facteurs de risque et observance thérapeutique
• Éducation thérapeutique et réadaptation cardiaque [6]`,
  
  PATIENT_EXPLANATIONS: `Monsieur, vous avez fait ce qu'on appelle un infarctus du myocarde, c'est-à-dire que votre cœur a manqué d'oxygène car une artère qui le nourrit s'est bouchée. 

Nous avons pu déboucher rapidement cette artère grâce à une intervention appelée angioplastie. Un petit ressort (stent) a été placé pour maintenir l'artère ouverte.

Votre cœur va maintenant récupérer progressivement. Il est très important de prendre vos médicaments tous les jours sans exception, car ils protègent votre cœur et empêchent que cela se reproduise.

Nous allons vous accompagner avec un programme de réadaptation pour reprendre progressivement vos activités. Avec un bon suivi et en contrôlant vos facteurs de risque, vous pourrez retrouver une vie normale. [7]`
}

// Demo references
const demoReferences = [
  {
    label: "1",
    title: "2023 ESC Guidelines for acute coronary syndromes",
    authors: "Byrne RA, Rossello X, et al.",
    url: "https://academic.oup.com/eurheartj/article/44/38/3720/7243210"
  },
  {
    label: "2",
    title: "Cardiovascular Risk Factors and Primary Prevention",
    authors: "Arnett DK, Blumenthal RS, et al.",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000678"
  },
  {
    label: "3",
    title: "Differential Diagnosis of Acute Chest Pain",
    authors: "Harrington RA, et al.",
    url: "https://pubmed.ncbi.nlm.nih.gov/example3"
  },
  {
    label: "4",
    title: "Cardiac Imaging in Acute Coronary Syndromes",
    authors: "Collet JP, Thiele H, et al.",
    url: "https://pubmed.ncbi.nlm.nih.gov/example4"
  },
  {
    label: "5",
    title: "Antithrombotic Therapy for Acute Coronary Syndromes",
    authors: "Mehta SR, et al.",
    url: "https://pubmed.ncbi.nlm.nih.gov/example5"
  },
  {
    label: "6",
    title: "Secondary Prevention After Myocardial Infarction",
    authors: "Smith SC Jr, et al.",
    url: "https://pubmed.ncbi.nlm.nih.gov/example6"
  },
  {
    label: "7",
    title: "Patient Education in Cardiovascular Disease",
    authors: "Kotseva K, et al.",
    url: "https://pubmed.ncbi.nlm.nih.gov/example7"
  }
]

// Composant principal avec toute la logique
function DemoPageContent() {
  // États principaux
  const [textContent, setTextContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [progressMessage, setProgressMessage] = useState("")
  const [currentSections, setCurrentSections] = useState<any[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAudioSupported, setIsAudioSupported] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{
    file: File
    name: string
    type: string
    size: number
    preview: string
    description: string
    promptType?: string
  }>>([])
  const [rareDiseaseData, setRareDiseaseData] = useState<{ disease: string, report: string, references: any[] } | null>(null)
  const [isSearchingRareDisease, setIsSearchingRareDisease] = useState(false)
  const [showRareDiseaseSection, setShowRareDiseaseSection] = useState(false)
  const [showDemoInfo, setShowDemoInfo] = useState(false)
  
  // État pour l'historique des analyses
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  
  // État pour le formulaire structuré
  const [structuredForm, setStructuredForm] = useState({
    contextePatient: '',
    anamnese: '',
    antecedents: '',
    examenClinique: '',
    examensComplementaires: ''
  })
  const [isExtractingForm, setIsExtractingForm] = useState(false)
  
  // États pour le système de retour et amélioration
  const [isEditingSection, setIsEditingSection] = useState<{ [key: string]: boolean }>({})
  const [additionalInfo, setAdditionalInfo] = useState<{ [key: string]: string }>({})
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [analysisVersions, setAnalysisVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState(0)
  const [showVersionComparison, setShowVersionComparison] = useState(false)
  const [caseTitle, setCaseTitle] = useState<string>("")
  const [initialCaseContent, setInitialCaseContent] = useState<string>("")
  const [requestChain, setRequestChain] = useState<any[]>([])
  
  // États pour les améliorations UI
  const [showInitialCase, setShowInitialCase] = useState(false)
  const [expandAllAccordions, setExpandAllAccordions] = useState(false)
  const [accordionValues, setAccordionValues] = useState<string[]>([])
  const [editingPreviousSection, setEditingPreviousSection] = useState<{ [key: string]: boolean }>({})
  const [editedPreviousInfo, setEditedPreviousInfo] = useState<{ [key: string]: string }>({})
  const [editingInitialCase, setEditingInitialCase] = useState(false)
  const [editedInitialCase, setEditedInitialCase] = useState("")
  
  // Hooks
  const { user, userCredits, signInWithGoogle, refreshCredits } = useAuth()
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error: recordingError
  } = useAudioRecorder()

  const aiService = new AIClientService()
  const hasApiKeys = aiService.hasApiKeys()
  const searchParams = useSearchParams()

  const [isRelaunchingAnalysis, setIsRelaunchingAnalysis] = useState(false)
  const [relaunchProgressMessage, setRelaunchProgressMessage] = useState('')

  // Effects
  useEffect(() => {
    setIsAudioSupported(AIClientService.isAudioRecordingSupported())
  }, [])

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'real') {
      setIsDemoMode(false)
    } else if (mode === 'demo') {
      setIsDemoMode(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDemoMode && !localStorage.getItem('demoInfoShown')) {
        setShowDemoInfo(true)
        localStorage.setItem('demoInfoShown', '1')
      }
    }
  }, [isDemoMode])

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (!mode) {
      if (user && isDemoMode) {
        setIsDemoMode(false)
      } else if (!user && !isDemoMode) {
        setIsDemoMode(true)
      }
    }
  }, [user, searchParams])

  useEffect(() => {
    if (isDemoMode) {
      setTextContent(demoSections.CLINICAL_CONTEXT)
    } else {
      setTextContent("")
    }
  }, [isDemoMode])

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || isDemoMode) return

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error("Veuillez sélectionner uniquement des fichiers image")
      return
    }

    // Limitation à 5 images maximum
    if (uploadedImages.length + imageFiles.length > 5) {
      toast.error("Maximum 5 images autorisées")
      return
    }

    // Créer les objets d'image avec preview
    const newImages = imageFiles.map(file => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: URL.createObjectURL(file),
      description: '' // Pour une éventuelle description de l'image
    }))

    setUploadedImages(prev => [...prev, ...newImages])
    toast.success(`${imageFiles.length} image(s) ajoutée(s)`)
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const updated = [...prev]
      // Nettoyer l'URL de preview
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview)
      }
      updated.splice(index, 1)
      return updated
    })
    toast.success("Image supprimée")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = async () => {
    try {
      await startRecording()
      toast.info("Enregistrement démarré. Parlez pour dicter votre cas clinique.")
    } catch (error) {
      toast.error("Impossible d'accéder au microphone")
    }
  }

  const handleStopRecording = async () => {
    setIsTranscribing(true)
    try {
      const audioBlob = await stopRecording()
      
      if (!audioBlob) {
        toast.error("Aucun enregistrement à transcrire")
        return
      }

      if (isDemoMode) {
        toast.info("Transcription simulée en mode démo...")
        setTimeout(() => {
          const demoTranscription = "Patient de 65 ans, hypertendu connu depuis 10 ans, diabétique de type 2, se présente aux urgences pour douleur thoracique rétrosternale intense apparue brutalement il y a 2 heures, irradiant vers le bras gauche, accompagnée de sueurs et nausées."
          setTextContent(demoTranscription)
          setIsTranscribing(false)
          toast.success("Transcription terminée (démo)")
        }, 2000)
      } else {
        if (!hasApiKeys) {
          toast.error("Les clés API ne sont pas configurées pour la transcription")
          setIsTranscribing(false)
          return
        }

        toast.info("Transcription en cours...")
        
        try {
          const transcription = await aiService.transcribeAudio(audioBlob)
          setTextContent(transcription)
          toast.success("Transcription terminée")
        } catch (error: any) {
          toast.error(error.message || "Erreur lors de la transcription")
          console.error("Erreur de transcription:", error)
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'arrêt de l'enregistrement")
      console.error(error)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleAnalyze = async (isSimpleAnalysis: boolean) => {
    if (!textContent.trim()) {
      toast.error("Veuillez entrer un cas clinique")
      return
    }

    if (!isDemoMode) {
      if (!user) {
        toast.error("Veuillez vous connecter pour utiliser le mode réel")
        return
      }

      if (!userCredits || userCredits.credits <= 0) {
        toast.error("Vous n'avez plus de crédits disponibles")
        return
      }
    }

    setIsAnalyzing(true)
    setProgressMessage("Analyse en cours...")
    
    try {
      // Convertir les images en base64 si nécessaire
      let base64Images: { base64: string, type: string, name: string, promptType?: string }[] = []
      
      if (uploadedImages.length > 0 && !isDemoMode) {
        setProgressMessage("Traitement des images...")
        
        for (const img of uploadedImages) {
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              const base64 = e.target?.result as string
              resolve(base64.split(',')[1]) // Retirer le préfixe data:image/...;base64,
            }
            reader.onerror = reject
          })
          reader.readAsDataURL(img.file)
          
          const base64Data = await base64Promise
          
          // Déterminer le type d'image
          let imageType = 'other'
          const fileName = img.name.toLowerCase()
          if (fileName.includes('bio') || fileName.includes('lab') || fileName.includes('sang')) {
            imageType = 'biology'
          } else if (fileName.includes('ecg') || fileName.includes('ekg')) {
            imageType = 'ecg'
          } else if (fileName.includes('radio') || fileName.includes('rx') || fileName.includes('irm') || 
                     fileName.includes('scan') || fileName.includes('echo')) {
            imageType = 'medical'
          }
          
          base64Images.push({
            base64: base64Data,
            type: imageType,
            name: img.name,
            promptType: img.promptType || 'general' // Utiliser le prompt sélectionné
          })
        }
      }
      
      setProgressMessage("Analyse en cours...")
    
    if (isDemoMode) {
        // Simulation pour le mode démo
      setTimeout(() => {
        setIsAnalyzing(false)
        setShowResults(true)
          setAnalysisData({
            isDemo: true,
            sections: Object.entries(demoSections).map(([key, content]) => ({ type: key, content })),
            references: demoReferences
          })
          toast.success("Analyse terminée !")
        }, 2000)
    } else {
        // Analyse réelle avec l'API
        try {
          // Sauvegarder le cas initial
          setInitialCaseContent(textContent)
          setCaseTitle(generateCaseTitle(textContent))
          
          let result;
          
          if (isSimpleAnalysis) {
            // Analyse simple avec o3 seulement
            setProgressMessage("Analyse clinique avec o3...")
            result = await aiService.simpleAnalysis(
              textContent,
              (message) => setProgressMessage(message),
              base64Images.length > 0 ? base64Images : undefined
            )
          } else {
            // Analyse approfondie avec Perplexity + o3
            result = await aiService.analyzeClinicalCase(
          textContent,
          (message) => setProgressMessage(message),
          (section, index, total) => {
                console.log(`Section ${index + 1}/${total} reçue:`, section.type)
            setCurrentSections(prev => [...prev, section])
              },
              base64Images.length > 0 ? base64Images : undefined
            )
          }

          // Sauvegarder en base de données
          if (user) {
            try {
              console.log('Tentative de sauvegarde dans l\'historique...')
              const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              const historyEntry = {
          id: analysisId,
                userId: user.uid,
                title: generateCaseTitle(textContent),
                date: new Date(),
          caseText: textContent,
          sections: result.sections,
                references: result.references || [],
                perplexityReport: result.perplexityReport || null,
                requestChain: result.requestChain || [],
                images: uploadedImages.length > 0 ? uploadedImages.map(img => ({
                  name: img.name,
                  type: img.type,
                  size: img.size
                })) : null,
                modificationHistory: [],
                version: 1,
                isSimpleAnalysis: isSimpleAnalysis
              }

              console.log('Données à sauvegarder:', historyEntry)
              const db = getFirebaseDb()
              
              // Utiliser setDoc avec l'ID personnalisé au lieu de addDoc
              await setDoc(doc(db, 'analyses', analysisId), historyEntry)
              console.log('Document sauvegardé avec l\'ID:', analysisId)
              
              // Stocker l'ID pour pouvoir le partager
              setAnalysisData({
                ...result,
                id: analysisId,
                isDemo: false,
                sections: result.sections,
                references: result.references || [],
                perplexityReport: result.perplexityReport || null,
                requestChain: result.requestChain || [],
                imageAnalyses: result.imageAnalyses,
                isSimpleAnalysis: isSimpleAnalysis
              })
              
              toast.success('Analyse sauvegardée dans votre historique')
            } catch (saveError: any) {
          console.error('Erreur lors de la sauvegarde:', saveError)
              toast.error(`Erreur de sauvegarde: ${saveError.message || 'Erreur inconnue'}`)
            }
          } else {
            console.log('Utilisateur non connecté, pas de sauvegarde dans l\'historique')
            // Si pas connecté, définir analysisData sans ID
            setAnalysisData({
              isDemo: false,
              sections: result.sections,
              references: result.references || [],
              perplexityReport: result.perplexityReport || null,
              requestChain: result.requestChain || [],
              imageAnalyses: result.imageAnalyses,
              isSimpleAnalysis: isSimpleAnalysis
            })
          }

          // Déduire un crédit
          if (user && refreshCredits) {
            await CreditsService.useCredit(user.uid)
            await refreshCredits()
          }

          setIsAnalyzing(false)
          setShowResults(true)
          setRequestChain(result.requestChain || [])
          toast.success(isSimpleAnalysis ? "Analyse simple terminée !" : "Analyse approfondie terminée !")
      } catch (error: any) {
          console.error("Erreur lors de l'analyse:", error)
        toast.error(error.message || "Erreur lors de l'analyse")
        setIsAnalyzing(false)
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error)
      toast.error("Erreur lors de l'analyse")
      setIsAnalyzing(false)
    }
  }

  // Fonction pour exporter l'historique complet (maxime.latry@gmail.com seulement)
  const exportAllHistory = () => {
    if (!analysisData) return
    
    const date = new Date().toISOString().split('T')[0]
    const filename = `historique_complet_${date}.json`
    
    const allData = {
      date: new Date().toISOString(),
      caseTitle: caseTitle || generateCaseTitle(textContent),
      initialCase: initialCaseContent || textContent,
      currentCase: textContent,
      analysis: {
        sections: analysisData.sections,
        references: analysisData.references,
        perplexityReport: analysisData.perplexityReport
      },
      modifications: analysisData.modificationHistory || [],
      images: uploadedImages.map(img => ({
        name: img.name,
        type: img.type,
        size: img.size
      }))
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Historique complet exporté')
  }
  
  // Fonction pour exporter la chaîne de requêtes (maxime.latry@gmail.com seulement)
  const exportRequestChain = () => {
    if (!analysisData?.requestChain) {
      toast.error('Aucune chaîne de requêtes à exporter')
      return
    }

    // Créer un rapport complet des requêtes
    const requestChainReport = {
      metadata: {
        exportedAt: new Date().toISOString(),
        analysisId: analysisData.id || 'unknown',
        userId: user?.uid || 'unknown',
        caseTitle: analysisData.caseTitle || caseTitle,
        totalRequests: analysisData.requestChain.length,
        analysisType: analysisData.isDemo ? 'demo' : 'real',
        version: analysisData.version || 1
      },
      
      flowSummary: {
        step1: "Analyse images MedGemma",
        step2: "Analyse clinique o3", 
        step3: "Recherche académique Perplexity structurée",
        step4: "Extraction références (toutes les sources)",
        step5: "Enrichissement Web Search GPT-4o mini",
        step6: "Ajout citations intelligentes",
        step7: "Affichage sections Perplexity + références"
      },
      
      detailedChain: analysisData.requestChain.map((request: any, index: number) => ({
        stepNumber: index + 1,
        timestamp: request.timestamp,
        model: request.model,
        requestType: request.type,
        fullRequest: request.request || 'Non disponible',
        fullResponse: request.response || 'Non disponible',
        requestLength: request.request?.length || 0,
        responseLength: request.response?.length || 0,
        success: !!request.response,
        duration: index > 0 ? 
          new Date(request.timestamp).getTime() - new Date(analysisData.requestChain[index-1].timestamp).getTime() 
          : 0
      })),
      
      statistics: {
        totalDuration: analysisData.requestChain.length > 1 ? 
          new Date(analysisData.requestChain[analysisData.requestChain.length - 1].timestamp).getTime() - 
          new Date(analysisData.requestChain[0].timestamp).getTime() : 0,
        modelsUsed: [...new Set(analysisData.requestChain.map((r: any) => r.model))],
        successRate: `${Math.round((analysisData.requestChain.filter((r: any) => r.response).length / analysisData.requestChain.length) * 100)}%`,
        averageRequestLength: Math.round(
          analysisData.requestChain.reduce((acc: number, r: any) => acc + (r.request?.length || 0), 0) / analysisData.requestChain.length
        ),
        averageResponseLength: Math.round(
          analysisData.requestChain.reduce((acc: number, r: any) => acc + (r.response?.length || 0), 0) / analysisData.requestChain.length
        )
      },
      
      currentState: {
        sectionsCount: analysisData.sections?.length || 0,
        referencesCount: analysisData.references?.length || 0,
        hasPerplexityReport: !!analysisData.perplexityReport,
        hasImageAnalyses: !!analysisData.imageAnalyses,
        lastModified: analysisData.lastRelaunched || analysisData.date
      }
    }

    const blob = new Blob([JSON.stringify(requestChainReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `request-chain-${analysisData.caseTitle?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'analysis'}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Chaîne de requêtes exportée avec détails complets')
  }
  
  // Fonction pour exporter le rapport de recherche Perplexity
  const exportPerplexityReport = () => {
    if (!analysisData?.perplexityReport) {
      toast.error('Aucun rapport de recherche disponible')
      return
    }
    
    const date = new Date().toISOString().split('T')[0]
    const filename = `rapport_recherche_${date}.txt`
    
    let content = `RAPPORT DE RECHERCHE MÉDICALE\n`
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n`
    content += `Cas: ${caseTitle || generateCaseTitle(textContent)}\n`
    content += `${'='.repeat(60)}\n\n`
    content += `RECHERCHE PERPLEXITY:\n${'-'.repeat(20)}\n`
    content += analysisData.perplexityReport.answer || 'Aucun contenu'
    content += `\n\n${'='.repeat(60)}\n\nSOURCES:\n${'-'.repeat(20)}\n`
    
    if (analysisData.perplexityReport.search_results) {
      analysisData.perplexityReport.search_results.forEach((result: any, idx: number) => {
        content += `\n[${idx + 1}] ${result.title || 'Sans titre'}\n`
        content += `URL: ${result.url || 'Non disponible'}\n`
        if (result.date) content += `Date: ${result.date}\n`
      })
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Rapport de recherche exporté')
  }

  // Fonction pour exporter en PDF
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('analysis-results')
      if (!element) {
        toast.error('Aucun résultat à exporter')
        return
      }

      toast.info('Génération du PDF en cours...')
      
      // Créer un conteneur temporaire avec du HTML simple
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '210mm'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.color = '#000000'
      tempContainer.style.fontFamily = 'Arial, sans-serif'
      tempContainer.style.padding = '20px'
      
      // Construire le contenu HTML simple
      let htmlContent = `
        <div style="background: white; color: black; padding: 20px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 10px;">Analyse Clinique</h1>
          <p style="color: #6b7280; margin-bottom: 20px;">${new Date().toLocaleDateString('fr-FR')}</p>
          
          <h2 style="color: #374151; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Cas clinique initial</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="white-space: pre-wrap; color: #1f2937;">${analysisData?.caseText || initialCaseContent || textContent}</p>
          </div>
      `
      
      // Ajouter les analyses d'images si présentes
      if (analysisData?.imageAnalyses && analysisData.imageAnalyses.length > 0) {
        htmlContent += `
          <h2 style="color: #374151; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Analyses d'imagerie</h2>
        `
        analysisData.imageAnalyses.forEach((analysis: string, index: number) => {
          htmlContent += `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 10px;">Image ${index + 1}</h3>
              <p style="white-space: pre-wrap; color: #374151;">${analysis}</p>
            </div>
          `
        })
      }
      
      // Ajouter les sections d'analyse
      const sectionsToExport = analysisData?.isDemo 
        ? Object.entries(demoSections).map(([key, content]) => ({ type: key, content }))
        : (currentSections.length > 0 ? currentSections : analysisData?.sections || [])
      
      htmlContent += `<h2 style="color: #374151; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Analyse médicale</h2>`
      
      sectionsToExport.forEach((section: any) => {
        const title = sectionTitles[section.type as keyof typeof sectionTitles] || section.type
        htmlContent += `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">${title}</h3>
            <div style="color: #374151; line-height: 1.6;">${section.content.replace(/\n/g, '<br>')}</div>
          </div>
        `
      })
      
      // Ajouter les références
      const refs = analysisData?.isDemo ? demoReferences : analysisData?.references || []
      if (refs.length > 0) {
        htmlContent += `
          <h2 style="color: #374151; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Références bibliographiques</h2>
          <ol style="padding-left: 20px;">
        `
        refs.forEach((ref: any) => {
          htmlContent += `
            <li style="margin-bottom: 10px; color: #374151;">
              <strong>${ref.title}</strong><br>
              ${ref.authors && ref.authors !== 'Non disponible' ? `${ref.authors}. ` : ''}
              ${ref.journal && ref.journal !== 'Non disponible' ? `${ref.journal}. ` : ''}
              ${ref.year ? `(${ref.year}). ` : ''}
              <a href="${ref.url}" style="color: #3b82f6;">${ref.url}</a>
            </li>
          `
        })
        htmlContent += `</ol>`
      }
      
      // Ajouter les maladies rares si présentes
      if (rareDiseaseData) {
        htmlContent += `
          <h2 style="color: #374151; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Recherche de maladies rares</h2>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">${rareDiseaseData.disease}</h3>
            <div style="white-space: pre-wrap; color: #78350f;">${rareDiseaseData.report}</div>
          </div>
        `
      }
      
      htmlContent += `</div>`
      
      // Ajouter le contenu au conteneur temporaire
      tempContainer.innerHTML = htmlContent
      document.body.appendChild(tempContainer)
      
      try {
        // Capturer avec html2canvas
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: tempContainer.scrollWidth,
          windowHeight: tempContainer.scrollHeight
        })
        
        // Créer le PDF
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0
        
        // Ajouter l'image au PDF, page par page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        
        // Sauvegarder le PDF
        const fileName = `analyse-clinique-${analysisData?.caseTitle?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'export'}-${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)
        
        toast.success('PDF exporté avec succès')
      } finally {
        // Nettoyer
        if (tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer)
        }
      }
    } catch (error) {
      console.error('Erreur export PDF:', error)
      toast.error('Erreur lors de l\'export PDF')
    }
  }

  // Fonction pour générer un titre de cas à partir du contenu
  const generateCaseTitle = (content: string): string => {
    // Extraire les premiers mots significatifs
    const words = content.trim().split(/\s+/).slice(0, 10).join(' ')
    
    // Patterns pour identifier les éléments clés
    const ageMatch = content.match(/(\d+)\s*ans?/i)
    const genderMatch = content.match(/\b(homme|femme|patient|patiente|garçon|fille|enfant)\b/i)
    const symptomMatch = content.match(/\b(douleur|fièvre|toux|dyspnée|vomissement|asthénie|vertige|céphalée|malaise)\b/i)
    
    let title = ""
    if (ageMatch && genderMatch) {
      title = `${genderMatch[1]} ${ageMatch[1]} ans`
      if (symptomMatch) {
        title += ` - ${symptomMatch[1]}`
      }
    } else if (words.length > 0) {
      title = words.length > 50 ? words.substring(0, 50) + "..." : words
    } else {
      title = "Cas clinique sans titre"
    }
    
    return title
  }

  // Fonction pour afficher le contenu avec les références
  const renderContentWithReferences = (content: string, references: any[]) => {
    // Diviser le contenu en segments pour gérer les références séparément
    const parts = content.split(/(\[\d+\])/g)
    
    return (
      <div className="prose max-w-none">
        {parts.map((part, index) => {
          // Vérifier si c'est une référence [1], [2], etc.
          const refMatch = part.match(/^\[(\d+)\]$/)
          if (refMatch) {
            const refNum = refMatch[1]
            const ref = references.find(r => r.label === refNum)
            if (ref) {
              return (
                <a
                  key={index}
                  href={`#ref-${refNum}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  [{refNum}]
                </a>
              )
            }
          }
          
          // Sinon, c'est du contenu normal - utiliser ReactMarkdown
          return (
            <ReactMarkdown 
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, children, ...props}) => {
                  // Ne pas wrapper dans <p> si c'est déjà inline
                  if (typeof children === 'string' && !children.includes('\n')) {
                    return <span {...props}>{children}</span>
                  }
                  return <p className="mb-4 text-gray-700 leading-relaxed" {...props}>{children}</p>
                },
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 text-gray-900" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 text-gray-900" {...props} />,
              }}
            >
              {part}
            </ReactMarkdown>
          )
        })}
      </div>
    )
  }

  // Fonction pour toggle tous les accordéons
  const toggleAllAccordions = () => {
    if (expandAllAccordions) {
      setAccordionValues([])
    } else {
      // Obtenir toutes les valeurs des sections
      let allValues = []
      
      if (analysisData?.isDemo) {
        // En mode démo, utiliser les clés de demoSections
        allValues = Object.keys(demoSections).map((_, index) => String(index))
      } else {
        // En mode réel, utiliser les sections disponibles
        const sections = currentSections.length > 0 ? currentSections : analysisData?.sections || []
        allValues = sections.map((_: any, index: number) => String(index))
      }
      
      setAccordionValues(allValues)
    }
    setExpandAllAccordions(!expandAllAccordions)
  }

  // Handlers pour le système de retour
  const handleAddInformation = (sectionType: string) => {
    setIsEditingSection({ ...isEditingSection, [sectionType]: true })
  }

  const handleCancelEdit = (sectionType: string) => {
    setIsEditingSection({ ...isEditingSection, [sectionType]: false })
    setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
  }

  const handleSaveAdditionalInfo = async (sectionType: string, shouldRelaunchAnalysis: boolean = false) => {
    const info = additionalInfo[sectionType]
    
    if (!info?.trim()) {
      toast.error("Veuillez entrer des informations avant de sauvegarder")
      return
    }

    if (shouldRelaunchAnalysis) {
      // Pour l'instant, juste afficher un message
      toast.info("La relance d'analyse sera implémentée prochainement")
    }
    
    // Sauvegarder l'information
    setIsEditingSection({ ...isEditingSection, [sectionType]: false })
    
    // Créer la nouvelle version avec l'information ajoutée
    const newAnalysisData = {
      ...analysisData,
      lastModified: new Date().toISOString(),
      modificationHistory: [
        ...(analysisData.modificationHistory || []),
        {
          sectionType,
          additionalInfo: info,
          timestamp: new Date().toISOString()
        }
      ]
    }
    
    setAnalysisData(newAnalysisData)
    setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
    
    toast.success("Information ajoutée avec succès")
  }

  // Fonction pour extraire les données structurées avec GPT-4o-mini
  const extractStructuredData = async () => {
    if (!textContent.trim()) {
      toast.error("Veuillez entrer un cas clinique avant d'extraire")
      return
    }

    setIsExtractingForm(true)
    
    try {
      const prompt = `Analyse ce cas clinique et extrais les informations selon ces catégories. Réponds UNIQUEMENT en JSON avec ces clés exactes : anamnese, antecedents, examenClinique, examensComplementaires, contextePatient.

CAS CLINIQUE :
${textContent}

INSTRUCTIONS :
1. anamnese : Symptômes principaux, chronologie, évolution
2. antecedents : Médicaux, chirurgicaux, familiaux, traitements actuels
3. examenClinique : Constantes vitales, examen physique par systèmes
4. examensComplementaires : Biologie, imagerie, ECG, etc.
5. contextePatient : Âge, sexe, profession, mode de vie

IMPORTANT : Chaque valeur dans le JSON doit être une STRING simple (pas d'objet, pas de tableau). Si une information n'est pas disponible, utilise la string "Non précisé".

Exemple de format attendu :
{
  "anamnese": "Douleur thoracique depuis 2h...",
  "antecedents": "HTA, diabète...",
  "examenClinique": "PA 140/90...",
  "examensComplementaires": "ECG normal...",
  "contextePatient": "65 ans, homme..."
}`;

      // Vérifier si on est en production ou en développement
      const isProduction = process.env.NODE_ENV === 'production'
      
      if (isProduction) {
        // En production, utiliser Firebase Functions
        const extractStructuredDataViaFunction = (await import('@/lib/firebase-functions')).extractStructuredDataViaFunction
        const rawData = await extractStructuredDataViaFunction(textContent)
        
        // S'assurer que toutes les valeurs sont des strings
        const structuredData = {
          anamnese: rawData.anamnese || 'Non précisé',
          antecedents: rawData.antecedents || 'Non précisé',
          examenClinique: rawData.examenClinique || 'Non précisé',
          examensComplementaires: rawData.examensComplementaires || 'Non précisé',
          contextePatient: rawData.contextePatient || 'Non précisé'
        }
        
        setStructuredForm(structuredData)
        toast.success("Extraction des données structurées réussie !")
      } else {
        // En développement, appel direct à OpenAI
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant médical expert en extraction d\'informations cliniques. Réponds UNIQUEMENT en JSON valide.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 2000
          },
          {
            headers: {
              'Authorization': `Bearer ${aiService.getOpenAIApiKey()}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const rawData = JSON.parse(response.data.choices[0].message.content)
        console.log('Données extraites:', rawData)
        
        // S'assurer que toutes les valeurs sont des strings
        const structuredData = {
          anamnese: rawData.anamnese || 'Non précisé',
          antecedents: rawData.antecedents || 'Non précisé',
          examenClinique: rawData.examenClinique || 'Non précisé',
          examensComplementaires: rawData.examensComplementaires || 'Non précisé',
          contextePatient: rawData.contextePatient || 'Non précisé'
        }
        
        setStructuredForm(structuredData)
        toast.success("Extraction des données structurées réussie !")
      }
    } catch (error: any) {
      console.error('Erreur extraction:', error)
      toast.error(error.message || "Erreur lors de l'extraction des données structurées")
    } finally {
      setIsExtractingForm(false)
    }
  }

  // Fonction pour rechercher des maladies rares
  const searchForRareDiseases = async () => {
    if (!analysisData || analysisData.isDemo) return
    
    // Vérifier les crédits
    if (!user || !userCredits || userCredits.credits < 1) {
      toast.error("Crédits insuffisants pour la recherche de maladies rares")
      return
    }

    setIsSearchingRareDisease(true)
    setShowRareDiseaseSection(true)
    
    try {
      // Préparer le contexte complet pour la recherche
      const fullContext = {
        clinicalCase: initialCaseContent || textContent,
        sections: analysisData.sections,
        perplexityReport: analysisData.perplexityReport
      }
      
      // Appeler le service de recherche de maladies rares
      const result = await aiService.searchRareDiseases(
        fullContext.clinicalCase,
        JSON.stringify(fullContext.sections),
        (message) => toast.info(message)
      )

      setRareDiseaseData(result)
      
      // Déduire un crédit
      if (user && refreshCredits) {
        await CreditsService.useCredit(user.uid)
        await refreshCredits()
      }
      
      toast.success('Recherche de maladies rares terminée')
    } catch (error: any) {
      console.error('Erreur recherche maladies rares:', error)
      toast.error(error.message || 'Erreur lors de la recherche de maladies rares')
      setShowRareDiseaseSection(false)
    } finally {
      setIsSearchingRareDisease(false)
    }
  }

  // Fonction pour lancer une reprise approfondie (2 crédits)
  const handleDeepAnalysis = async () => {
    if (!analysisData || !user || !userCredits || userCredits.credits < 2) return
    
    // Sauvegarder la version actuelle avant la mise à jour
    if (analysisData) {
      const currentVersion = {
        timestamp: new Date().toISOString(),
        sections: analysisData.sections,
        references: analysisData.references,
        perplexityReport: analysisData.perplexityReport,
        type: 'deep_analysis',
        version: analysisVersions.length + 1
      }
      setAnalysisVersions(prev => [...prev, currentVersion])
    }
    
    setIsAnalyzing(true)
    setProgressMessage("Reprise approfondie en cours...")
    
    try {
      // Convertir les images en base64 si nécessaire
      let base64Images: { base64: string, type: string, name: string }[] = []
      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              const base64 = e.target?.result as string
              resolve(base64.split(',')[1])
            }
            reader.onerror = reject
          })
          reader.readAsDataURL(img.file)
          const base64Data = await base64Promise
          
          base64Images.push({
            base64: base64Data,
            type: img.type,
            name: img.name
          })
        }
      }
      
      // Préparer le contexte complet
      const fullContext = {
        initialCase: initialCaseContent || textContent,
        currentCase: textContent,
        sections: analysisData.sections,
        perplexityReport: analysisData.perplexityReport,
        modifications: analysisData.modificationHistory || [],
        images: base64Images.length > 0 ? base64Images : undefined
      }
      
      // Lancer la reprise approfondie avec la nouvelle méthode
      const result = await aiService.deepAnalysis(
        fullContext,
        (message) => setProgressMessage(message),
        (section, index, total) => {
          console.log(`Section approfondie ${index + 1}/${total} reçue:`, section.type)
          setCurrentSections(prev => [...prev, section])
        }
      )

      // Déduire 2 crédits
      if (user && refreshCredits) {
        await CreditsService.useCredit(user.uid)
        await CreditsService.useCredit(user.uid) // 2ème crédit
        await refreshCredits()
      }

      // Mettre à jour avec les nouveaux résultats
      setAnalysisData({
        ...analysisData,
        sections: result.sections,
        references: result.references,
        perplexityReport: result.perplexityReport,
        requestChain: result.requestChain,
        isDeepAnalysis: true,
        imageAnalyses: result.imageAnalyses,
        version: analysisVersions.length + 2,
        previousVersion: analysisVersions.length + 1
      })
      setRequestChain(result.requestChain || [])
      setCurrentSections(result.sections) // Forcer l'affichage des nouvelles sections
      
      toast.success("Reprise approfondie terminée !")
    } catch (error: any) {
      console.error("Erreur reprise approfondie:", error)
      toast.error(error.message || "Erreur lors de la reprise approfondie")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Fonction pour relancer l'analyse (1 crédit)
  const handleRelaunchAnalysis = async () => {
    if (!analysisData || !user || !userCredits || userCredits.credits < 1) return
    
    // Sauvegarder la version actuelle avant la mise à jour
    if (analysisData) {
      const currentVersion = {
        timestamp: new Date().toISOString(),
        sections: analysisData.sections,
        references: analysisData.references,
        perplexityReport: analysisData.perplexityReport,
        type: 'relaunch_analysis',
        version: analysisVersions.length + 1
      }
      setAnalysisVersions(prev => [...prev, currentVersion])
    }
    
    setIsRelaunchingAnalysis(true)
    setRelaunchProgressMessage("Relance de l'analyse en cours...")
    
    try {
      // Convertir les images en base64 si nécessaire
      let base64Images: { base64: string, type: string, name: string }[] = []
      if (uploadedImages.length > 0) {
        setRelaunchProgressMessage("Préparation des images...")
        for (const img of uploadedImages) {
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              const base64 = e.target?.result as string
              resolve(base64.split(',')[1])
            }
            reader.onerror = reject
          })
          reader.readAsDataURL(img.file)
          const base64Data = await base64Promise
          
          base64Images.push({
            base64: base64Data,
            type: img.type,
            name: img.name
          })
        }
      }
      
      // Collecter les modifications
      let modifications = ''
      if (analysisData.modificationHistory && analysisData.modificationHistory.length > 0) {
        modifications = analysisData.modificationHistory
          .map((mod: any) => `[${mod.sectionType}]: ${mod.additionalInfo}`)
          .join('\n\n')
      }
      
      // Préparer les données actuelles
      const currentData = {
        sections: analysisData.sections,
        references: analysisData.references,
        modifications: modifications,
        images: base64Images.length > 0 ? base64Images : undefined
      }
      
      // Relancer avec la méthode qui n'utilise que o3
      const result = await aiService.relaunchAnalysis(
        currentData,
        (message) => setRelaunchProgressMessage(message)
      )

      // Déduire 1 crédit
      if (user && refreshCredits) {
        await CreditsService.useCredit(user.uid)
        await refreshCredits()
      }

      // Mettre à jour uniquement les sections (pas de nouvelle recherche Perplexity)
      const updatedData = {
        ...analysisData,
        sections: result.sections,
        // On garde les références et perplexityReport existants
        requestChain: result.requestChain,
        lastRelaunched: new Date().toISOString(),
        version: analysisVersions.length + 2,
        previousVersion: analysisVersions.length + 1
      }
      setAnalysisData(updatedData)
      setCurrentSections(result.sections) // Forcer la mise à jour de l'affichage
      setRequestChain(result.requestChain || [])
      
      toast.success("Analyse relancée avec succès !")
    } catch (error: any) {
      console.error("Erreur relance analyse:", error)
      toast.error(error.message || "Erreur lors de la relance")
    } finally {
      setIsRelaunchingAnalysis(false)
      setRelaunchProgressMessage('')
    }
  }

  // Fonction pour appliquer les données structurées au cas clinique
  const updateFromStructuredForm = () => {
    const sections = []
    
    if (structuredForm.contextePatient) {
      sections.push(`CONTEXTE PATIENT:\n${structuredForm.contextePatient}`)
    }
    
    if (structuredForm.anamnese) {
      sections.push(`ANAMNÈSE:\n${structuredForm.anamnese}`)
    }
    
    if (structuredForm.antecedents) {
      sections.push(`ANTÉCÉDENTS:\n${structuredForm.antecedents}`)
    }
    
    if (structuredForm.examenClinique) {
      sections.push(`EXAMEN CLINIQUE:\n${structuredForm.examenClinique}`)
    }
    
    if (structuredForm.examensComplementaires) {
      sections.push(`EXAMENS COMPLÉMENTAIRES:\n${structuredForm.examensComplementaires}`)
    }
    
    if (sections.length > 0) {
      const structuredText = sections.join('\n\n')
      setTextContent(structuredText)
      toast.success("Données structurées appliquées au cas clinique")
    } else {
      toast.warning("Aucune donnée structurée à appliquer")
    }
  }

  // Interface principale
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
              <Link href="/history">
            <Button variant="outline" size="sm" disabled={!user}>
                  <History className="mr-2 h-4 w-4" />
                  Historique
                </Button>
              </Link>
        </div>

        {/* Bannière orange MODE DÉMO */}
        {isDemoMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-orange-600" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Mode démonstration activé</p>
                <p>Cette version affiche un exemple d'analyse préformaté pour illustrer les fonctionnalités.</p>
              </div>
            </div>
          </div>
        )}

        {/* Popup d'information au premier usage */}
        {showDemoInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl max-w-md shadow-2xl">
              <h2 className="text-orange-500 font-bold text-2xl mb-4 text-center">Mode Démonstration</h2>
              <p className="text-gray-700 mb-6 text-center">
                Vous utilisez le mode démonstration. Les données sont préremplies et non modifiables. 
                Pour analyser vos propres cas cliniques, connectez-vous pour utiliser le mode réel.
              </p>
              <button 
                className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
                onClick={() => setShowDemoInfo(false)}
              >
                J'ai compris
              </button>
          </div>
        </div>
        )}

        {!showResults ? (
          <>
            {isAnalyzing ? (
              // Loader sophistiqué pendant l'analyse
              <div className="max-w-4xl mx-auto">
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <div className="space-y-8">
                      {/* Animation du cerveau/IA */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-ping"></div>
                          </div>
                          <div className="relative z-10 p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
                            <Brain className="w-16 h-16 text-white animate-pulse" />
                          </div>
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-gray-800">Analyse en cours...</h2>
                        <p className="mt-2 text-gray-600 text-center max-w-md">
                          Notre IA médicale analyse votre cas clinique en profondeur
                        </p>
                      </div>

                      {/* Barre de progression avec étapes */}
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progression</span>
                          <span className="font-medium">{progressMessage}</span>
                        </div>
                        
                        <div className="relative">
                          <div className="flex justify-between mb-2">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progressMessage.includes('image') ? 'bg-blue-600 text-white' : progressMessage.includes('Analyse') ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                                <Camera className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-1">Images</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progressMessage.includes('académique') ? 'bg-blue-600 text-white animate-pulse' : progressMessage.includes('références') || progressMessage.includes('complète') ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                                <Search className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-1">Recherche</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progressMessage.includes('références') ? 'bg-blue-600 text-white animate-pulse' : progressMessage.includes('complète') ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                                <Brain className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-1">Analyse</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progressMessage.includes('complète') ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-300'}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-1">Structuration</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${progressMessage.includes('complète') && currentSections.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                                <CheckCircle className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-1">Finalisation</span>
                            </div>
                          </div>
                          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 -z-10"></div>
                          <div 
                            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 -z-10 transition-all duration-500"
                            style={{ 
                              width: progressMessage.includes('image') ? '20%' : 
                                     progressMessage.includes('académique') ? '40%' :
                                     progressMessage.includes('références') ? '60%' :
                                     progressMessage.includes('complète') ? '80%' :
                                     currentSections.length > 0 ? '100%' : '10%'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Sections en cours de génération */}
                      {currentSections.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-700">Sections générées :</h3>
                          <div className="space-y-2">
                            {currentSections.map((section, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-gray-800">
                                  {sectionTitles[section.type as keyof typeof sectionTitles] || section.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messages informatifs */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800 space-y-1">
                            <p className="font-medium">Le saviez-vous ?</p>
                            <p>Notre IA utilise les dernières avancées en traitement du langage naturel pour analyser votre cas clinique et croiser les informations avec les bases de données médicales les plus récentes.</p>
                          </div>
                        </div>
                      </div>

                      {/* Temps estimé */}
                      <div className="text-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Temps estimé : 30-45 secondes
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Entrez votre cas clinique</CardTitle>
                  <CardDescription>
                    Collez ou tapez le cas clinique à analyser
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="demo-toggle" className="text-sm">
                    Mode démo
                  </Label>
                  <Button
                    id="demo-toggle"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDemoMode(!isDemoMode)}
                    className="p-1"
                  >
                    {isDemoMode ? (
                      <ToggleRight className="h-6 w-6 text-blue-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="content">Cas clinique</Label>
                  {isAudioSupported && (
                    <div className="flex items-center gap-2">
                      {isRecording && (
                        <span className="text-sm text-gray-600">
                          {formatTime(recordingTime)}
                        </span>
                      )}
                      {!isRecording ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleStartRecording}
                              disabled={isTranscribing || isDemoMode}
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Dicter
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          {isPaused ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={resumeRecording}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={pauseRecording}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleStopRecording}
                          >
                            <MicOff className="h-4 w-4 mr-2" />
                            Arrêter
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <textarea
                  id="content"
                  value={textContent}
                      onChange={(e) => !isDemoMode && setTextContent(e.target.value)}
                  placeholder="Exemple : Patient de 65 ans, hypertendu connu, se présente aux urgences pour douleur thoracique..."
                      className={`w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDemoMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={isRecording || isTranscribing || isDemoMode}
                />
                {recordingError && (
                  <p className="text-sm text-red-600 mt-2">{recordingError}</p>
                )}
                {isTranscribing && (
                  <p className="text-sm text-gray-600 mt-2 animate-pulse">
                    Transcription en cours...
                  </p>
                )}
                    {!isDemoMode && !user && (
                      <div className="flex items-center gap-2 mt-2 text-red-600 font-semibold">
                        <Lock className="h-4 w-4" /> 
                        <span>Connexion requise pour utiliser la fonctionnalité avec vos données</span>
                      </div>
                )}
              </div>

                  {/* Formulaire structuré dans un accordéon */}
                  {!isDemoMode && hasApiKeys && (
                    <Accordion type="multiple" className="mt-4 border rounded-lg">
                      <AccordionItem value="structured-form" className="border-0">
                        <AccordionTrigger className="px-4 hover:no-underline bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">Formulaire structuré</h3>
                              <p className="text-sm text-gray-600">Organisez les informations du cas clinique</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                          <div className="space-y-4">
                            {/* Boutons d'action */}
                            <div className="flex gap-2 justify-end">
                              {textContent.trim() && (
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  onClick={extractStructuredData}
                                  disabled={isExtractingForm}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                  {isExtractingForm ? (
                                    <>
                                      <Brain className="mr-2 h-4 w-4 animate-pulse" />
                                      Extraction en cours...
                                    </>
                                  ) : (
                                    <>
                                      <Brain className="mr-2 h-4 w-4" />
                                      Extraire automatiquement
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={updateFromStructuredForm}
                                disabled={!structuredForm.anamnese && !structuredForm.antecedents && !structuredForm.examenClinique}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Appliquer au cas
                              </Button>
                            </div>
                            
                            {/* Champs du formulaire */}
                            <div className="space-y-3 bg-white p-4 rounded-lg border">
                              <div>
                                <Label htmlFor="contextePatient" className="text-sm font-medium flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  Contexte patient
                                </Label>
                                <textarea
                                  id="contextePatient"
                                  value={structuredForm.contextePatient}
                                  onChange={(e) => setStructuredForm({...structuredForm, contextePatient: e.target.value})}
                                  placeholder="Âge, sexe, profession, mode de vie..."
                                  className="w-full mt-1 p-2 border rounded-md text-sm h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="anamnese" className="text-sm font-medium flex items-center gap-2">
                                  <History className="h-4 w-4 text-gray-500" />
                                  Anamnèse
                                </Label>
                                <textarea
                                  id="anamnese"
                                  value={structuredForm.anamnese}
                                  onChange={(e) => setStructuredForm({...structuredForm, anamnese: e.target.value})}
                                  placeholder="Symptômes principaux, chronologie, évolution..."
                                  className="w-full mt-1 p-2 border rounded-md text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="antecedents" className="text-sm font-medium flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  Antécédents
                                </Label>
                                <textarea
                                  id="antecedents"
                                  value={structuredForm.antecedents}
                                  onChange={(e) => setStructuredForm({...structuredForm, antecedents: e.target.value})}
                                  placeholder="Médicaux, chirurgicaux, familiaux, traitements..."
                                  className="w-full mt-1 p-2 border rounded-md text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="examenClinique" className="text-sm font-medium flex items-center gap-2">
                                  <Search className="h-4 w-4 text-gray-500" />
                                  Examen clinique
                                </Label>
                                <textarea
                                  id="examenClinique"
                                  value={structuredForm.examenClinique}
                                  onChange={(e) => setStructuredForm({...structuredForm, examenClinique: e.target.value})}
                                  placeholder="Constantes, examen physique par systèmes..."
                                  className="w-full mt-1 p-2 border rounded-md text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="examensComplementaires" className="text-sm font-medium flex items-center gap-2">
                                  <Microscope className="h-4 w-4 text-gray-500" />
                                  Examens complémentaires
                                </Label>
                                <textarea
                                  id="examensComplementaires"
                                  value={structuredForm.examensComplementaires}
                                  onChange={(e) => setStructuredForm({...structuredForm, examensComplementaires: e.target.value})}
                                  placeholder="Biologie, imagerie, ECG, etc..."
                                  className="w-full mt-1 p-2 border rounded-md text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

              {/* Upload d'images */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="images">Images médicales (optionnel)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="file"
                      id="images"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                          disabled={isDemoMode}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('images')?.click()}
                          disabled={isAnalyzing || isDemoMode}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Ajouter des images
                    </Button>
                    <span className="text-sm text-gray-600">
                      {uploadedImages.length > 0 && `${uploadedImages.length} image(s) ajoutée(s)`}
                    </span>
                  </div>
                  
                  {/* Guide des prompts MedGemma */}
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Comment MedGemma choisit l'analyse
                    </h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p><strong>Général :</strong> Analyse médicale standard - éléments pathologiques et conclusions</p>
                      <p><strong>Dermatologie :</strong> Lésions cutanées - caractéristiques et diagnostic différentiel</p>
                      <p><strong>Radiologie :</strong> Imagerie médicale - anomalies et conclusions radiologiques</p>
                      <p><strong>Anatomopathologie :</strong> Lames histologiques - morphologie et diagnostic</p>
                      <p><strong>Cardiologie :</strong> ECG/Echo/Angio - anomalies cardiaques prioritaires</p>
                      <p><strong>Ophtalmologie :</strong> Fond d'œil/segment antérieur - anomalies oculaires</p>
                      <p><strong>Urgence :</strong> Analyse rapide - signes critiques pour prise en charge</p>
                    </div>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{img.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Type détecté automatiquement : {img.type === 'medical' && 'Imagerie médicale'}
                              {img.type === 'biology' && 'Résultats biologiques'}
                              {img.type === 'ecg' && 'ECG'}
                              {img.type === 'other' && 'Autre'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Sélecteur de prompt MedGemma */}
                        <div className="mt-3">
                          <Label htmlFor={`prompt-${index}`} className="text-xs font-medium text-gray-700">
                            Type d'analyse MedGemma (plus court et orienté conclusions)
                          </Label>
                          <select
                            id={`prompt-${index}`}
                            value={img.promptType || 'general'}
                            onChange={(e) => {
                              const updatedImages = [...uploadedImages]
                              updatedImages[index] = { ...img, promptType: e.target.value }
                              setUploadedImages(updatedImages)
                            }}
                            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="general">Général - Analyse médicale standard</option>
                            <option value="dermatology">Dermatologie - Lésions cutanées</option>
                            <option value="radiology">Radiologie - Imagerie médicale</option>
                            <option value="pathology">Anatomopathologie - Lames histologiques</option>
                            <option value="cardiology">Cardiologie - ECG/Echo/Angio</option>
                            <option value="ophthalmology">Ophtalmologie - Fond d'œil</option>
                            <option value="emergency">Urgence - Analyse rapide</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isAnalyzing && progressMessage && (
                <div className="text-center text-sm text-gray-600">
                  {progressMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => handleAnalyze(true)} // Analyse simple
                  disabled={isAnalyzing || !textContent.trim() || (!isDemoMode && !hasApiKeys) || (!isDemoMode && !user)}
                  variant="outline"
                  className="min-w-[200px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Brain className="mr-2 h-4 w-4 animate-pulse" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyse simple (o3 seulement)
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => handleAnalyze(false)} // Analyse approfondie
                  disabled={isAnalyzing || !textContent.trim() || (!isDemoMode && !hasApiKeys) || (!isDemoMode && !user)}
                  className="min-w-[200px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Brain className="mr-2 h-4 w-4 animate-pulse" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyse approfondie et sourcée
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
            )}
          </>
        ) : (
          <div id="analysis-results">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  Résultat de l'analyse {analysisData?.isDemo ? "(Démo)" : "(IA)"}
                </h2>
              </div>
              <div className="flex gap-2">
                {/* Boutons avec tooltips */}
                {!analysisData?.isDemo && analysisData?.modificationHistory && analysisData.modificationHistory.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeepAnalysis()}
                    disabled={!user || !userCredits || (userCredits.credits ?? 0) < 2}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reprise approfondie (2 crédits)
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lancer une recherche sourcée sur la base du contenu disponible et du dossier initial</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!analysisData?.isDemo && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRelaunchAnalysis()}
                  disabled={!user || !userCredits || (userCredits.credits ?? 0) < 1 || isRelaunchingAnalysis}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                >
                  {isRelaunchingAnalysis ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {relaunchProgressMessage || "Relance en cours..."}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Relancer l'analyse (1 crédit)
                    </>
                  )}
                </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reprendre le dossier actuel et actualiser l'analyse</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Bouton historique des versions */}
                {analysisVersions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVersionComparison(!showVersionComparison)}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                  >
                    <History className="mr-2 h-4 w-4" />
                    Versions ({analysisVersions.length})
                  </Button>
                )}
                {/* Boutons spéciaux pour maxime.latry@gmail.com */}
                {user?.email === 'maxime.latry@gmail.com' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportAllHistory()}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All (1)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportRequestChain()}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                      Export Chain
                </Button>
                  </>
                )}
                {/* Bouton Rapport de recherche - visible pour tous en mode réel */}
                {!analysisData?.isDemo && analysisData?.perplexityReport && (
                <Button
                  variant="outline"
                  size="sm"
                    onClick={() => exportPerplexityReport()}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300"
                >
                  <FileText className="mr-2 h-4 w-4" />
                    Rapport de recherche
                </Button>
                )}
                {/* Export PDF - visible pour tous */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF()}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResults(false)
                    setTextContent("")
                    setAnalysisData(null)
                    setCurrentSections([])
                    setUploadedImages([])
                    setRareDiseaseData(null)
                    setShowRareDiseaseSection(false)
                  }}
                >
                  Nouvelle analyse
                </Button>
              </div>
            </div>
            
            {analysisData && (
              <>
                {/* Dossier initial */}
                <Accordion type="multiple" className="mb-4" value={showInitialCase ? ["initial-case"] : []}>
                  <AccordionItem value="initial-case" className="border rounded-lg">
                    <AccordionTrigger 
                      className="px-6 hover:no-underline bg-gray-50"
                      onClick={() => setShowInitialCase(!showInitialCase)}
                    >
                      <span className="text-left font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Voir dossier initial
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {/* Section texte */}
                        <div className="bg-gray-50 p-4 rounded-lg relative">
                          {editingInitialCase ? (
                            <div className="space-y-3">
                              <textarea
                                value={editedInitialCase}
                                onChange={(e) => setEditedInitialCase(e.target.value)}
                                className="w-full p-3 border rounded-lg resize-none h-64 text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const updatedData = {
                                      ...analysisData,
                                      caseText: editedInitialCase
                                    }
                                    setAnalysisData(updatedData)
                                    setEditingInitialCase(false)
                                    toast.success("Dossier initial modifié")
                                  }}
                                >
                                  Sauvegarder
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingInitialCase(false)
                                    setEditedInitialCase("")
                                  }}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {analysisData?.caseText || initialCaseContent || textContent}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setEditingInitialCase(true)
                                  setEditedInitialCase(analysisData?.caseText || initialCaseContent || textContent)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        
                        {/* Section images */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <Camera className="h-4 w-4" />
                              Images médicales jointes
                            </h4>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                id="additional-images"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => document.getElementById('additional-images')?.click()}
                              >
                                <ImagePlus className="h-4 w-4 mr-2" />
                                Ajouter
                              </Button>
                              {uploadedImages.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setUploadedImages([])
                                    toast.success("Toutes les images ont été supprimées")
                                  }}
                                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Tout supprimer
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {uploadedImages.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">Aucune image attachée</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Ajoutez des images pour enrichir l'analyse
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {uploadedImages.map((img, index) => {
                                // Trouver l'analyse correspondante si elle existe
                                const imageAnalysis = analysisData?.imageAnalyses?.[index]
                                
                                return (
                                  <div key={index} className="border rounded-lg p-4 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {/* Image */}
                                      <div className="relative group">
                                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                          <img
                                            src={img.preview}
                                            alt={img.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="mt-2">
                                          <p className="text-xs font-medium truncate">{img.name}</p>
                                          <p className="text-xs text-gray-500">
                                            {img.type === 'medical' && 'Imagerie médicale'}
                                            {img.type === 'biology' && 'Résultats biologiques'}
                                            {img.type === 'ecg' && 'ECG'}
                                            {img.type === 'other' && 'Autre'}
                                          </p>
                                        </div>
                                        <Button
                                          size="icon"
                                          variant="destructive"
                                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => removeImage(index)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      {/* Analyse de l'image */}
                                      <div className="md:col-span-2">
                                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                          <Microscope className="h-4 w-4" />
                                          Analyse de l'image
                                        </h5>
                                        {imageAnalysis ? (
                                          <div className="prose prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {imageAnalysis}
                                            </ReactMarkdown>
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded">
                                            L'analyse de cette image sera disponible après la prochaine analyse
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          {uploadedImages.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-700">
                                <Info className="h-4 w-4 inline mr-1" />
                                {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} seront analysées lors de la prochaine recherche
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Modal historique des versions */}
                {showVersionComparison && analysisVersions.length > 0 && (
                  <Dialog open={showVersionComparison} onOpenChange={setShowVersionComparison}>
                    <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Gestion des versions de l'analyse
                        </DialogTitle>
                        <DialogDescription>
                          Comparez les différentes versions de votre analyse clinique
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {/* Version actuelle */}
                        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-green-800">Version actuelle</h3>
                            <Badge className="bg-green-600">Active</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {analysisData?.version ? `Version ${analysisData.version}` : 'Version 1'} • 
                            {analysisData?.lastRelaunched ? ` Mise à jour le ${new Date(analysisData.lastRelaunched).toLocaleString('fr-FR')}` : ' Version initiale'}
                          </p>
                        </div>
                        
                        {/* Versions précédentes */}
                        {[...analysisVersions].reverse().map((version, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">Version {version.version}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {version.type === 'deep_analysis' ? 'Reprise approfondie' : 
                                   version.type === 'relaunch_analysis' ? 'Relance' : 'Analyse initiale'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Restaurer cette version
                                    setAnalysisData({
                                      ...version,
                                      isRestored: true,
                                      restoredFrom: analysisData
                                    })
                                    setCurrentSections(version.sections)
                                    setShowVersionComparison(false)
                                    toast.success(`Version ${version.version} restaurée`)
                                  }}
                                >
                                  Restaurer
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              Créée le {new Date(version.timestamp).toLocaleString('fr-FR')}
                            </p>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>• {version.sections.length} sections</p>
                              <p>• {version.references.length} références</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Boutons pour gérer les accordéons */}
                <div className="mb-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllAccordions}
                  >
                    {expandAllAccordions ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Fermer tout
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Ouvrir tout
                      </>
                    )}
                  </Button>
                </div>
                
                <Accordion 
                  type="multiple" 
                  className="w-full space-y-4" 
                  value={accordionValues}
                  onValueChange={setAccordionValues}
                >
              {analysisData?.isDemo ? (
                // Mode démo - afficher les sections prédéfinies
                Object.entries(demoSections).map(([key, content], index) => (
                  <AccordionItem key={key} value={String(index)} className="border rounded-lg">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <span className="text-left font-medium">
                        {sectionTitles[key as keyof typeof sectionTitles]}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      {renderContentWithReferences(content, demoReferences)}
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                // Mode réel - afficher les sections au fur et à mesure
                (currentSections.length > 0 ? currentSections : analysisData?.sections || []).map((section: any, index: number) => (
                  <AccordionItem key={index} value={String(index)} className="border rounded-lg">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <span className="text-left font-medium">
                        {sectionTitles[section.type as keyof typeof sectionTitles]}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                          <div className="mb-4">
                      {renderContentWithReferences(section.content, analysisData?.references || [])}
                          </div>
                          
                          {/* Afficher les modifications précédentes s'il y en a */}
                          {analysisData?.modificationHistory?.filter((mod: any) => mod.sectionType === section.type).length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <Label className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4" />
                                Informations ajoutées précédemment :
                              </Label>
                              {analysisData.modificationHistory
                                .filter((mod: any) => mod.sectionType === section.type)
                                .map((mod: any, idx: number) => (
                                  <div key={idx} className="relative">
                                    {editingPreviousSection[`${section.type}-${idx}`] ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={editedPreviousInfo[`${section.type}-${idx}`] || mod.additionalInfo}
                                          onChange={(e) => setEditedPreviousInfo({
                                            ...editedPreviousInfo,
                                            [`${section.type}-${idx}`]: e.target.value
                                          })}
                                          className="w-full p-2 border rounded text-sm h-20 resize-none"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              // Mettre à jour la modification
                                              const updatedHistory = analysisData.modificationHistory.map((m: any, i: number) => {
                                                if (m.sectionType === section.type && i === idx) {
                                                  return {
                                                    ...m,
                                                    additionalInfo: editedPreviousInfo[`${section.type}-${idx}`]
                                                  }
                                                }
                                                return m
                                              })
                                              setAnalysisData({
                                                ...analysisData,
                                                modificationHistory: updatedHistory
                                              })
                                              setEditingPreviousSection({
                                                ...editingPreviousSection,
                                                [`${section.type}-${idx}`]: false
                                              })
                                              toast.success("Modification mise à jour")
                                            }}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingPreviousSection({
                                                ...editingPreviousSection,
                                                [`${section.type}-${idx}`]: false
                                              })
                                              setEditedPreviousInfo({
                                                ...editedPreviousInfo,
                                                [`${section.type}-${idx}`]: mod.additionalInfo
                                              })
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-blue-700 mb-2 group flex items-start justify-between">
                                        <span>• {mod.additionalInfo}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingPreviousSection({
                                                ...editingPreviousSection,
                                                [`${section.type}-${idx}`]: true
                                              })
                                              setEditedPreviousInfo({
                                                ...editedPreviousInfo,
                                                [`${section.type}-${idx}`]: mod.additionalInfo
                                              })
                                            }}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="hover:text-red-600"
                                            onClick={() => {
                                              // Supprimer la modification
                                              const updatedHistory = analysisData.modificationHistory.filter((m: any, i: number) => {
                                                return !(m.sectionType === section.type && i === idx)
                                              })
                                              setAnalysisData({
                                                ...analysisData,
                                                modificationHistory: updatedHistory
                                              })
                                              toast.success("Modification supprimée")
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                          
                          {/* Zone d'édition pour ajouter des informations */}
                          {isEditingSection[section.type] ? (
                            <div className="mt-4 space-y-3 border-t pt-4">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Ajouter des informations complémentaires
                              </Label>
                              <textarea
                                value={additionalInfo[section.type] || ''}
                                onChange={(e) => setAdditionalInfo({
                                  ...additionalInfo,
                                  [section.type]: e.target.value
                                })}
                                placeholder="Ex: Le patient présente également une toux sèche depuis 3 jours..."
                                className="w-full p-3 border rounded-lg resize-none h-24 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <div className="flex gap-2">
                <Button
                                  size="sm"
                                  onClick={() => handleSaveAdditionalInfo(section.type, false)}
                                  disabled={!additionalInfo[section.type]?.trim()}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Ajouter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveAdditionalInfo(section.type, true)}
                                  disabled={!additionalInfo[section.type]?.trim() || !user || !userCredits || (userCredits.credits ?? 0) <= 0}
                                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Ajouter et relancer l'analyse
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelEdit(section.type)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 border-t pt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddInformation(section.type)}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter des informations
                </Button>
              </div>
            )}
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>

                {/* Section Maladies Rares - Intégrée dans l'accordion principal */}
            {!analysisData?.isDemo && analysisData?.sections && (
                  <Accordion type="multiple" className="mt-4">
                    <AccordionItem value="rare-diseases" className="border rounded-lg">
                      <AccordionTrigger className="px-6 hover:no-underline bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center gap-3">
                          <Microscope className="h-5 w-5 text-purple-600" />
                          <span className="text-left font-medium">Recherche de maladies rares</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        {!showRareDiseaseSection ? (
                          <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">
                              Lancez une recherche avancée pour identifier des maladies rares 
                              potentiellement en lien avec le cas clinique
                            </p>
                <Button
                              onClick={searchForRareDiseases}
                              disabled={isSearchingRareDisease || !user || !userCredits || (userCredits.credits ?? 0) <= 0}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSearchingRareDisease ? (
                    <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                                  <Search className="mr-2 h-4 w-4" />
                                  Lancer la recherche (1 crédit)
                    </>
                  )}
                </Button>
                            {(!user || !userCredits || (userCredits.credits ?? 0) <= 0) && (
                              <p className="text-sm text-red-600 mt-2">
                                {!user ? "Connexion requise" : "Crédits insuffisants"}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            {isSearchingRareDisease ? (
                              // Loader sophistiqué pour la recherche de maladies rares
                              <div className="space-y-6">
                                <div className="flex flex-col items-center">
                                  <div className="relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-ping"></div>
                                    </div>
                                    <div className="relative z-10 p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-lg">
                                      <Microscope className="w-12 h-12 text-white animate-pulse" />
                                    </div>
                                  </div>
                                  <h3 className="mt-4 text-lg font-semibold text-gray-800">Recherche en cours...</h3>
                                  <p className="mt-2 text-sm text-gray-600 text-center max-w-md">
                                    Exploration des bases de données spécialisées : Orphanet, OMIM, GeneReviews
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                                  <div className="text-center">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <Globe className="w-6 h-6 text-purple-600 animate-pulse" />
              </div>
                                    <p className="text-xs text-gray-600">Orphanet</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <BookOpen className="w-6 h-6 text-pink-600 animate-pulse" />
                                    </div>
                                    <p className="text-xs text-gray-600">OMIM</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <FileSearch className="w-6 h-6 text-purple-600 animate-pulse" />
                                    </div>
                                    <p className="text-xs text-gray-600">GeneReviews</p>
                                  </div>
                                </div>
                                
                                <div className="bg-purple-50 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-purple-800 space-y-1">
                                      <p className="font-medium">Recherche approfondie</p>
                                      <p>Notre IA analyse les symptômes et compare avec plus de 7000 maladies rares référencées.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : rareDiseaseData && (
                              <RareDiseaseResults data={rareDiseaseData} />
                            )}
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {/* Section supprimée - Le contenu Perplexity est maintenant intégré dans les 7 sections principales */}

                {/* Références bibliographiques */}
                <Accordion type="multiple" className="mt-8">
                  <AccordionItem value="references" className="border rounded-lg">
                    <AccordionTrigger className="px-6 hover:no-underline bg-gray-50">
                      <span className="text-left font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Références bibliographiques ({(analysisData?.isDemo ? demoReferences : analysisData?.references || []).length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <ul className="space-y-4 mt-4">
                      {(analysisData?.isDemo ? demoReferences : analysisData?.references || []).map((ref: any) => (
                          <li key={ref.label} id={`ref-${ref.label}`} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                          <div className="flex items-start gap-3">
                            <span className="text-blue-600 font-bold text-lg min-w-[30px]">[{ref.label}]</span>
                            <div className="flex-1">
                              <p className="font-semibold text-base text-gray-900 mb-1">{ref.title}</p>
                              {ref.authors && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Auteurs :</span> {ref.authors}
                                </p>
                              )}
                              {ref.journal && (
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">Journal :</span> {ref.journal}
                                    {ref.year && ` (${ref.year})`}
                                </p>
                              )}
                                {ref.date && !ref.year && (
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">Date :</span> {new Date(ref.date).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                                {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 font-medium"
                              >
                                Consulter la source
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <DemoPageContent />
    </Suspense>
  )
} 