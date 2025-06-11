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
  Globe, Calculator
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
  
  // États pour les améliorations UI
  const [showInitialCase, setShowInitialCase] = useState(false)
  const [expandAllAccordions, setExpandAllAccordions] = useState(false)
  const [accordionValues, setAccordionValues] = useState<string[]>([])
  const [editingPreviousSection, setEditingPreviousSection] = useState<{ [key: string]: boolean }>({})
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

  const handleAnalyze = async () => {
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
      let base64Images: { base64: string, type: string, name: string }[] = []
      
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
            name: img.name
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
        // TODO: Implémenter l'appel à l'API avec base64Images
        toast.info("L'analyse réelle sera implémentée prochainement")
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error)
      toast.error("Erreur lors de l'analyse")
      setIsAnalyzing(false)
    }
  }

  // Fonction pour afficher le contenu avec les références
  const renderContentWithReferences = (content: string, references: any[]) => {
    const processContent = (text: string) => {
      let processedText = text
      
      // Remplacer les références [1], [2], etc. par des liens
      references.forEach(ref => {
        const regex = new RegExp(`\\[${ref.label}\\]`, 'g')
        processedText = processedText.replace(
          regex,
          `<a href="#ref-${ref.label}" class="text-blue-600 hover:text-blue-800 font-semibold">[${ref.label}]</a>`
        )
      })
      
      return processedText
    }

    return (
      <div className="prose max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
            li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 text-gray-900" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 text-gray-900" {...props} />,
          }}
        >
          {processContent(content)}
        </ReactMarkdown>
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
        anamnese: typeof rawData.anamnese === 'string' ? rawData.anamnese : JSON.stringify(rawData.anamnese || 'Non précisé'),
        antecedents: typeof rawData.antecedents === 'string' ? rawData.antecedents : JSON.stringify(rawData.antecedents || 'Non précisé'),
        examenClinique: typeof rawData.examenClinique === 'string' ? rawData.examenClinique : JSON.stringify(rawData.examenClinique || 'Non précisé'),
        examensComplementaires: typeof rawData.examensComplementaires === 'string' ? rawData.examensComplementaires : JSON.stringify(rawData.examensComplementaires || 'Non précisé'),
        contextePatient: typeof rawData.contextePatient === 'string' ? rawData.contextePatient : JSON.stringify(rawData.contextePatient || 'Non précisé')
      }
      
      setStructuredForm(structuredData)
      toast.success("Extraction des données structurées réussie !")
    } catch (error) {
      console.error('Erreur extraction:', error)
      toast.error("Erreur lors de l'extraction des données structurées")
    } finally {
      setIsExtractingForm(false)
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
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <p className="text-xs font-medium truncate">{img.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Type: {img.type}</p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
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

              <div className="flex justify-end">
                <Button
                  onClick={handleAnalyze}
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
                      <Brain className="mr-2 h-4 w-4" />
                      Analyser le cas
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                          onClick={() => toast.info("Reprise approfondie à implémenter")}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reprise approfondie
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
                          onClick={() => toast.info("Relance d'analyse à implémenter")}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Relancer l'analyse (1 crédit)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reprendre le dossier actuel et actualiser l'analyse</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
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
                              {analysisData?.caseText || textContent}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setEditingInitialCase(true)
                                setEditedInitialCase(analysisData?.caseText || textContent)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

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
                                  <div key={idx} className="text-sm text-blue-700 mb-2">
                                    • {mod.additionalInfo}
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

                {/* Références */}
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Références bibliographiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
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
                  </CardContent>
                </Card>
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