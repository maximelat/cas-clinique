"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Brain, FileText, AlertCircle, ArrowLeft, Copy, ToggleLeft, ToggleRight, Download, FileDown, Mic, MicOff, Pause, Play, ImagePlus, X, Lock, Coins, Microscope, History, Settings, ChevronRight, ChevronDown, Camera, Info, Search, BookOpen, Code, AlertTriangle, Calendar, Users, Pill, Maximize2, CircleCheck, Eye, Plus, RefreshCw, GitBranch, Edit, ChevronUp } from "lucide-react"
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

// Composant interne qui utilise useSearchParams
function DemoPageContent() {
  const [textContent, setTextContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [progressMessage, setProgressMessage] = useState("")
  const [currentSections, setCurrentSections] = useState<any[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAudioSupported, setIsAudioSupported] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<{ base64: string, type: string, name: string }[]>([])
  const [rareDiseaseData, setRareDiseaseData] = useState<{ disease: string, report: string, references: any[] } | null>(null)
  const [isSearchingRareDisease, setIsSearchingRareDisease] = useState(false)
  const [showRareDiseaseSection, setShowRareDiseaseSection] = useState(false)
  const [showDemoInfo, setShowDemoInfo] = useState(false)
  
  // Ajout d'un state pour l'historique des analyses
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  
  // Nouveau : state pour le formulaire structuré
  const [structuredForm, setStructuredForm] = useState({
    anamnese: '',
    antecedents: '',
    examenClinique: '',
    examensComplementaires: '',
    contextePatient: ''
  })
  const [isExtractingForm, setIsExtractingForm] = useState(false)
  
  // Nouveaux états pour le système de retour et amélioration
  const [isEditingSection, setIsEditingSection] = useState<{ [key: string]: boolean }>({})
  const [additionalInfo, setAdditionalInfo] = useState<{ [key: string]: string }>({})
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [analysisVersions, setAnalysisVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState(0)
  const [showVersionComparison, setShowVersionComparison] = useState(false)
  const [caseTitle, setCaseTitle] = useState<string>("")
  
  // Nouveaux états pour les améliorations
  const [showInitialCase, setShowInitialCase] = useState(false)
  const [expandAllAccordions, setExpandAllAccordions] = useState(false)
  const [accordionValues, setAccordionValues] = useState<string[]>([])
  const [editingPreviousSection, setEditingPreviousSection] = useState<{ [key: string]: boolean }>({})
  const [editingInitialCase, setEditingInitialCase] = useState(false)
  const [editedInitialCase, setEditedInitialCase] = useState("")
  
  // Authentification
  const { user, userCredits, signInWithGoogle, refreshCredits } = useAuth()
  
  // Hook pour l'enregistrement audio
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

  // Vérifier si les clés API sont disponibles
  const aiService = new AIClientService()
  const hasApiKeys = aiService.hasApiKeys()

  // Utilisation de useSearchParams
  const searchParams = useSearchParams()

  // Vérifier le support audio côté client seulement
  useEffect(() => {
    setIsAudioSupported(AIClientService.isAudioRecordingSupported())
  }, [])

  // Lire le paramètre mode de l'URL
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'real') {
      setIsDemoMode(false)
    } else if (mode === 'demo') {
      setIsDemoMode(true)
    }
  }, [searchParams])

  // Affichage de la popup au premier usage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDemoMode && !localStorage.getItem('demoInfoShown')) {
        setShowDemoInfo(true)
        localStorage.setItem('demoInfoShown', '1')
      }
    }
  }, [isDemoMode])

  // Mode réel par défaut si connecté
  useEffect(() => {
    // Ne pas changer si on a un paramètre d'URL explicite
    const mode = searchParams.get('mode')
    if (!mode) {
      if (user && isDemoMode) {
        setIsDemoMode(false)
      } else if (!user && !isDemoMode) {
        setIsDemoMode(true)
      }
    }
  }, [user, searchParams])

  // Préremplissage et blocage du champ en mode démo
  useEffect(() => {
    if (isDemoMode) {
      setTextContent(demoSections.CLINICAL_CONTEXT)
    } else {
      setTextContent("")
    }
  }, [isDemoMode])

  // Gérer l'upload d'images
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        // Déterminer le type d'image médicale
        let imageType = 'other';
        const fileName = file.name.toLowerCase();
        if (fileName.includes('bio') || fileName.includes('lab') || fileName.includes('sang')) {
          imageType = 'biology';
        } else if (fileName.includes('ecg') || fileName.includes('ekg')) {
          imageType = 'ecg';
        } else if (fileName.includes('radio') || fileName.includes('rx') || fileName.includes('irm') || 
                   fileName.includes('scan') || fileName.includes('echo')) {
          imageType = 'medical';
        }

        setUploadedImages(prev => [...prev, {
          base64: base64Data,
          type: imageType,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  }

  // Supprimer une image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }

  // Formater le temps d'enregistrement
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Gérer le début de l'enregistrement
  const handleStartRecording = async () => {
    try {
      await startRecording()
      toast.info("Enregistrement démarré. Parlez pour dicter votre cas clinique.")
    } catch (error) {
      toast.error("Impossible d'accéder au microphone")
    }
  }

  // Gérer l'arrêt et la transcription
  const handleStopRecording = async () => {
    setIsTranscribing(true)
    try {
      const audioBlob = await stopRecording()
      
      if (!audioBlob) {
        toast.error("Aucun enregistrement à transcrire")
        return
      }

      if (isDemoMode) {
        // En mode démo, simuler une transcription
        toast.info("Transcription simulée en mode démo...")
        setTimeout(() => {
          const demoTranscription = "Patient de 65 ans, hypertendu connu depuis 10 ans, diabétique de type 2, se présente aux urgences pour douleur thoracique rétrosternale intense apparue brutalement il y a 2 heures, irradiant vers le bras gauche, accompagnée de sueurs et nausées."
          setTextContent(demoTranscription)
          setIsTranscribing(false)
          toast.success("Transcription terminée (démo)")
        }, 2000)
      } else {
        // Mode réel - utiliser l'API OpenAI
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

    // Vérifier l'authentification pour le mode réel
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
    setProgressMessage("")
    setCurrentSections([])
    const startTime = Date.now()
    
    // Extraire automatiquement les données structurées si pas déjà fait
    let structuredData = null;
    if (!structuredForm.anamnese && !isDemoMode && hasApiKeys) {
      setProgressMessage("Extraction des informations structurées...")
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
        console.log('Données extraites automatiquement:', rawData)
        
        // S'assurer que toutes les valeurs sont des strings
        structuredData = {
          anamnese: typeof rawData.anamnese === 'string' ? rawData.anamnese : JSON.stringify(rawData.anamnese || 'Non précisé'),
          antecedents: typeof rawData.antecedents === 'string' ? rawData.antecedents : JSON.stringify(rawData.antecedents || 'Non précisé'),
          examenClinique: typeof rawData.examenClinique === 'string' ? rawData.examenClinique : JSON.stringify(rawData.examenClinique || 'Non précisé'),
          examensComplementaires: typeof rawData.examensComplementaires === 'string' ? rawData.examensComplementaires : JSON.stringify(rawData.examensComplementaires || 'Non précisé'),
          contextePatient: typeof rawData.contextePatient === 'string' ? rawData.contextePatient : JSON.stringify(rawData.contextePatient || 'Non précisé')
        }
        
        setStructuredForm(structuredData)
        
        // Ajouter à la chaîne de requêtes
        if (user?.email === 'maxime.latry@gmail.com') {
          aiService.addToRequestChain({
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini',
            requestType: 'structured_extraction',
            request: prompt,
            response: structuredData
          })
        }
      } catch (error) {
        console.error('Erreur extraction:', error)
        // Continuer sans extraction structurée
      }
    }
    
    // Sauvegarder la requête dans l'historique
    const currentRequest = {
      timestamp: new Date().toISOString(),
      query: textContent,
      images: uploadedImages,
      mode: isDemoMode ? 'demo' : 'real',
      structuredData: structuredData || structuredForm
    };
    
    if (isDemoMode) {
      toast.info("Analyse en mode démonstration...")
      // Mode démo - afficher les données prédéfinies après un délai
      setTimeout(() => {
        setIsAnalyzing(false)
        setShowResults(true)
        const demoResult = { 
          isDemo: true,
          sections: Object.entries(demoSections).map(([key, content]) => ({ type: key, content })),
          references: demoReferences
        };
        setAnalysisData(demoResult)
        
        // Ajouter à l'historique
        setAnalysisHistory(prev => [...prev, {
          ...currentRequest,
          result: demoResult
        }]);
        
        toast.success("Analyse simulée terminée !")
      }, 3000)
    } else {
      // Mode réel - utiliser le service AI
      if (!hasApiKeys) {
        toast.error("Les clés API ne sont pas configurées")
        setIsAnalyzing(false)
        return
      }

      // Utiliser un crédit
      try {
        const creditUsed = await CreditsService.useCredit(user!.uid)
        if (!creditUsed) {
          toast.error("Impossible d'utiliser un crédit")
          setIsAnalyzing(false)
          return
        }
        
        await refreshCredits() // Rafraîchir l'affichage des crédits
        toast.info(`Analyse en cours... (${userCredits!.credits - 1} crédits restants)`)
      } catch (error) {
        toast.error("Erreur lors de l'utilisation du crédit")
        setIsAnalyzing(false)
        return
      }

      try {
        // Réinitialiser la chaîne de requêtes pour maxime.latry@gmail.com
        if (user?.email === 'maxime.latry@gmail.com') {
          aiService.clearRequestChain();
        }
        
        // Préparer le texte enrichi avec les données structurées si disponibles
        let enrichedText = textContent;
        if (structuredData || structuredForm.anamnese || structuredForm.antecedents || structuredForm.examenClinique) {
          const formData = structuredData || structuredForm;
          
          // S'assurer que les données sont des strings et non des objets
          const contexte = typeof formData.contextePatient === 'string' ? formData.contextePatient : (formData.contextePatient || 'Non précisé');
          const anamnese = typeof formData.anamnese === 'string' ? formData.anamnese : (formData.anamnese || 'Non précisé');
          const antecedents = typeof formData.antecedents === 'string' ? formData.antecedents : (formData.antecedents || 'Non précisé');
          const examen = typeof formData.examenClinique === 'string' ? formData.examenClinique : (formData.examenClinique || 'Non précisé');
          const examens = typeof formData.examensComplementaires === 'string' ? formData.examensComplementaires : (formData.examensComplementaires || 'Non précisé');
          
          enrichedText = `CAS CLINIQUE STRUCTURÉ :

CONTEXTE PATIENT:
${contexte}

ANAMNÈSE:
${anamnese}

ANTÉCÉDENTS:
${antecedents}

EXAMEN CLINIQUE:
${examen}

EXAMENS COMPLÉMENTAIRES:
${examens}

CAS CLINIQUE ORIGINAL:
${textContent}`;
        }
        
        const result = await aiService.analyzeClinicalCase(
          enrichedText,
          (message) => setProgressMessage(message),
          (section, index, total) => {
            // Afficher les sections au fur et à mesure
            setCurrentSections(prev => [...prev, section])
            if (!showResults) setShowResults(true)
          },
          uploadedImages.length > 0 ? uploadedImages : undefined
        )

        // Générer un ID unique pour l'analyse
        const analysisId = `cas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Générer un titre basé sur le début du cas clinique (max 100 caractères)
        const titleBase = textContent.replace(/\s+/g, ' ').trim()
        const analysisTitle = titleBase.length > 100 
          ? titleBase.substring(0, 97) + '...' 
          : titleBase
        
        const analysisData = {
          id: analysisId,
          date: new Date().toISOString(),
          title: analysisTitle,
          isDemo: false,
          caseText: textContent,
          structuredData: structuredForm.anamnese || structuredForm.antecedents || structuredForm.examenClinique
            ? structuredForm : null,
          sections: result.sections,
          references: result.references,
          perplexityReport: result.perplexityReport,
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
          requestChain: user?.email === 'maxime.latry@gmail.com' ? aiService.getRequestChain() : undefined
        }
        
        setAnalysisData(analysisData)
        
        // Générer le titre du cas clinique avec GPT-4o-mini
        generateCaseTitle(textContent).then((generatedTitle) => {
          if (caseTitle && caseTitle !== "Cas clinique") {
            setAnalysisData((prev: any) => ({ ...prev, title: caseTitle }))
          }
        })
        
        // Ajouter à l'historique
        setAnalysisHistory(prev => [...prev, {
          ...currentRequest,
          result: analysisData
        }]);
        
        // Sauvegarder dans l'historique
        try {
          await HistoryService.saveAnalysis(user!.uid, analysisData)
          console.log('Analyse sauvegardée dans l\'historique')
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde:', saveError)
          // Ne pas bloquer l'utilisateur si la sauvegarde échoue
        }
        
        const duration = Date.now() - startTime
        toast.success(`Analyse terminée en ${Math.round(duration / 1000)}s !`)
        toast.info(`ID de l'analyse : ${analysisId}`, { duration: 5000 })
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'analyse")
        console.error("Erreur:", error)
      } finally {
        setIsAnalyzing(false)
        setProgressMessage("")
      }
    }
  }

  const copyToClipboard = () => {
    let fullText = ""
    
    if (analysisData?.isDemo) {
      fullText = Object.entries(demoSections).map(([key, content]) => 
        `${sectionTitles[key as keyof typeof sectionTitles]}\n\n${content}`
      ).join("\n\n---\n\n")
    } else if (analysisData?.sections) {
      fullText = analysisData.sections.map((section: any) => 
        `${sectionTitles[section.type as keyof typeof sectionTitles]}\n\n${section.content}`
      ).join("\n\n---\n\n")
    }
    
    navigator.clipboard.writeText(fullText)
    toast.success("Copié dans le presse-papier")
  }

  const downloadPerplexityReport = () => {
    if (!analysisData?.perplexityReport) return

    const content = `RAPPORT DE RECHERCHE ACADÉMIQUE\n\n${analysisData.perplexityReport.answer}\n\n` +
      `RÉFÉRENCES:\n${analysisData.references.map((ref: any) => 
        `[${ref.label}] ${ref.title}\n${ref.url}`
      ).join('\n\n')}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rapport-recherche.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Rapport de recherche téléchargé")
  }

  const exportAsText = () => {
    if (!analysisData || !analysisData.sections) {
      toast.error("Aucune analyse à exporter")
      return
    }

    const sections = analysisData.sections
    let textContent = `ANALYSE CLINIQUE\n`
    textContent += `================\n\n`
    textContent += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`

    sections.forEach((section: any) => {
      const title = sectionTitles[section.type as keyof typeof sectionTitles] || section.type
      textContent += `${title}\n`
      textContent += `${'-'.repeat(title.length)}\n`
      textContent += `${section.content}\n\n`
    })

    if (analysisData.references && analysisData.references.length > 0) {
      textContent += `RÉFÉRENCES:\n${analysisData.references.map((ref: any) => 
        `[${ref.label}] ${ref.title} - ${ref.url}`
      ).join('\n')}`
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analyse-clinique-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Nouvelle fonction pour exporter la chaîne de requêtes
  const exportRequestChain = () => {
    if (!analysisData || !analysisData.requestChain) {
      toast.error("Aucune chaîne de requêtes disponible")
      return
    }

    let chainContent = "=== CHAÎNE COMPLÈTE DES REQUÊTES ET RÉPONSES ===\n";
    chainContent += `Exporté le : ${new Date().toLocaleString('fr-FR')}\n`;
    chainContent += `Cas clinique : ${analysisData.caseText || textContent}\n`;
    chainContent += "=================================================\n\n";

    analysisData.requestChain.forEach((item: any, index: number) => {
      chainContent += `\n--- REQUÊTE ${index + 1} ---\n`;
      chainContent += `Timestamp : ${new Date(item.timestamp).toLocaleString('fr-FR')}\n`;
      chainContent += `Modèle : ${item.model}\n`;
      chainContent += `Type : ${item.type}\n\n`;
      
      chainContent += "=== REQUÊTE ===\n";
      chainContent += item.request + "\n\n";
      
      chainContent += "=== RÉPONSE ===\n";
      // Si la réponse est déjà un string JSON, essayer de le parser et le reformater
      try {
        const parsed = JSON.parse(item.response);
        chainContent += JSON.stringify(parsed, null, 2) + "\n";
      } catch {
        // Si ce n'est pas du JSON, afficher tel quel
        chainContent += item.response + "\n";
      }
      
      chainContent += "\n" + "=".repeat(80) + "\n";
    });

    // Ajouter un résumé
    chainContent += "\n\n=== RÉSUMÉ ===\n";
    chainContent += `Nombre total de requêtes : ${analysisData.requestChain.length}\n`;
    chainContent += `Modèles utilisés : ${[...new Set(analysisData.requestChain.map((r: any) => r.model))].join(', ')}\n`;

    // Télécharger le fichier
    const blob = new Blob([chainContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chaine-requetes-${analysisData.id || new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Chaîne de requêtes exportée !");
  };

  const exportAsPDF = async () => {
    const element = document.getElementById('analysis-results')
    if (!element) {
      console.error('Element analysis-results non trouvé')
      toast.error("Impossible de trouver le contenu à exporter")
      return
    }

    toast.info("Génération du PDF en cours...")
    
    try {
      console.log('Début de la génération du PDF...')
      
      // Méthode alternative : créer un PDF avec le contenu texte directement
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = margin
      
      // Ajouter le titre
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Analyse de Cas Clinique', margin, yPosition)
      yPosition += 15
      
      // Ajouter la date
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(new Date().toLocaleDateString('fr-FR'), margin, yPosition)
      yPosition += 10
      
      // Ligne de séparation
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      // Ajouter le contenu des sections
      pdf.setFontSize(12)
      
      if (analysisData?.isDemo) {
        // Mode démo
        Object.entries(demoSections).forEach(([key, content]) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage()
            yPosition = margin
          }
          
          // Titre de section
          pdf.setFont('helvetica', 'bold')
          const title = sectionTitles[key as keyof typeof sectionTitles]
          pdf.text(title, margin, yPosition)
          yPosition += 8
          
          // Contenu de section
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(10)
          
          // Nettoyer le contenu Markdown
          const cleanContent = content
            .replace(/\*\*(.*?)\*\*/g, '$1') // Enlever le bold
            .replace(/\[(.*?)\]/g, '[$1]') // Garder les références
            .replace(/•/g, '-') // Remplacer les bullets
          
          const lines = pdf.splitTextToSize(cleanContent, maxWidth)
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage()
              yPosition = margin
            }
            pdf.text(line, margin, yPosition)
            yPosition += 5
          })
          
          yPosition += 10
          pdf.setFontSize(12)
        })
      } else if (analysisData?.sections) {
        // Mode réel
        const sections = currentSections.length > 0 ? currentSections : analysisData.sections
        sections.forEach((section: any) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage()
            yPosition = margin
          }
          
          // Titre de section
          pdf.setFont('helvetica', 'bold')
          const title = sectionTitles[section.type as keyof typeof sectionTitles]
          pdf.text(title, margin, yPosition)
          yPosition += 8
          
          // Contenu de section
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(10)
          
          // Nettoyer le contenu Markdown
          const cleanContent = section.content
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\[(.*?)\]/g, '[$1]')
            .replace(/•/g, '-')
          
          const lines = pdf.splitTextToSize(cleanContent, maxWidth)
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage()
              yPosition = margin
            }
            pdf.text(line, margin, yPosition)
            yPosition += 5
          })
          
          yPosition += 10
          pdf.setFontSize(12)
        })
      }
      
      // Ajouter les références
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.text('Références bibliographiques', margin, yPosition)
      yPosition += 8
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      
      const references = analysisData?.isDemo ? demoReferences : (analysisData?.references || [])
      references.forEach((ref: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = margin
        }
        
        const refText = `[${ref.label}] ${ref.title}${ref.authors ? ' - ' + ref.authors : ''}${ref.year ? ' (' + ref.year + ')' : ''}`
        const lines = pdf.splitTextToSize(refText, maxWidth)
        lines.forEach((line: string) => {
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
        
        if (ref.url && ref.url !== '#') {
          pdf.setTextColor(0, 0, 255)
          pdf.textWithLink(ref.url, margin, yPosition, { url: ref.url })
          pdf.setTextColor(0, 0, 0)
          yPosition += 5
        }
        
        yPosition += 3
      })
      
      // Si la recherche de maladies rares a été effectuée
      if (rareDiseaseData && showRareDiseaseSection) {
        pdf.addPage()
        yPosition = margin
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('8. Recherche de maladies rares', margin, yPosition)
        yPosition += 8
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        
        const cleanContent = rareDiseaseData.report
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\[(.*?)\]/g, '[$1]')
          .replace(/•/g, '-')
        
        const lines = pdf.splitTextToSize(cleanContent, maxWidth)
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
      }
      
      // Sauvegarder le PDF
      pdf.save('analyse-cas-clinique.pdf')
      toast.success("PDF téléchargé avec succès")
      console.log('PDF généré avec succès')
      
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error)
      
      // Fallback : essayer avec html2canvas si la méthode directe échoue
      try {
        console.log('Tentative avec html2canvas...')
        
        // Ouvrir tous les accordions avant la capture
        const accordionButtons = element.querySelectorAll('[data-state="closed"]')
        accordionButtons.forEach(button => {
          (button as HTMLElement).click()
        })
        
        // Attendre que les animations se terminent
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const canvas = await html2canvas(element, {
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          ignoreElements: (element) => {
            // Ignorer certains éléments problématiques
            return element.classList.contains('no-print')
          }
        })
        
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 190 // Largeur avec marges
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
        
        // Ajouter des pages si nécessaire
        let heightLeft = imgHeight - 277 // 297 - 20 de marges
        let position = -277
        
        while (heightLeft > 0) {
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
          heightLeft -= 277
          position -= 277
        }
        
        pdf.save('analyse-cas-clinique.pdf')
        toast.success("PDF téléchargé (méthode alternative)")
        
      } catch (fallbackError: any) {
        console.error('Erreur avec html2canvas:', fallbackError)
        toast.error(`Impossible de générer le PDF. Erreur: ${error.message}`)
      }
    }
  }

  const searchRareDiseases = async () => {
    if (!analysisData || analysisData.isDemo) {
      toast.error("La recherche de maladies rares n'est disponible qu'en mode réel après analyse")
      return
    }

    setIsSearchingRareDisease(true)
    setProgressMessage("Recherche de maladies rares en cours...")

    try {
      // Récupérer le contenu de l'analyse o3
      const o3Analysis = analysisData.sections.map((section: any) => 
        `${sectionTitles[section.type as keyof typeof sectionTitles]}: ${section.content}`
      ).join('\n\n')

      const result = await aiService.searchRareDiseases(
        textContent,
        o3Analysis,
        (message) => setProgressMessage(message)
      )

      setRareDiseaseData(result)
      setShowRareDiseaseSection(true)
      
      // Ajouter la section aux sections de l'analyse
      const updatedSections = [...(analysisData.sections || []), {
        type: 'RARE_DISEASES',
        content: result.report
      }]
      
      // Mettre à jour analysisData avec la nouvelle section
      const updatedAnalysisData = {
        ...analysisData,
        sections: updatedSections,
        rareDiseaseData: result
      }
      
      setAnalysisData(updatedAnalysisData)

      toast.success("Recherche de maladies rares terminée")
      
      // Mettre à jour l'analyse dans l'historique si elle existe
      if (analysisData && analysisData.id && user) {
        try {
          await HistoryService.saveAnalysis(user.uid, updatedAnalysisData)
          console.log('Analyse mise à jour avec la recherche de maladies rares')
        } catch (saveError) {
          console.error('Erreur lors de la mise à jour:', saveError)
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la recherche de maladies rares")
      console.error("Erreur:", error)
    } finally {
      setIsSearchingRareDisease(false)
      setProgressMessage("")
    }
  }

  // Fonction pour exporter tout l'historique (uniquement pour maxime.latry@gmail.com)
  const exportAllHistory = () => {
    if (analysisHistory.length === 0) {
      toast.error("Aucune analyse dans l'historique")
      return
    }

    let fullContent = "=== HISTORIQUE COMPLET DES ANALYSES ===\n";
    fullContent += `Exporté le : ${new Date().toLocaleString('fr-FR')}\n`;
    fullContent += `Utilisateur : ${user?.email}\n`;
    fullContent += `Nombre total d'analyses : ${analysisHistory.length}\n`;
    fullContent += "=======================================\n\n";

    analysisHistory.forEach((item, index) => {
      fullContent += `\n--- ANALYSE ${index + 1} ---\n`;
      fullContent += `Date : ${new Date(item.timestamp).toLocaleString('fr-FR')}\n`;
      fullContent += `Mode : ${item.mode}\n`;
      fullContent += `Images : ${item.images?.length || 0}\n\n`;
      
      fullContent += "REQUÊTE :\n";
      fullContent += item.query + "\n\n";
      
      if (item.result) {
        fullContent += "RÉSULTAT :\n";
        
        // Sections
        item.result.sections?.forEach((section: any) => {
          const title = sectionTitles[section.type as keyof typeof sectionTitles] || section.type;
          fullContent += `\n${title}\n`;
          fullContent += "-".repeat(title.length) + "\n";
          fullContent += section.content + "\n";
        });
        
        // Références
        if (item.result.references?.length > 0) {
          fullContent += "\nRÉFÉRENCES BIBLIOGRAPHIQUES :\n";
          item.result.references.forEach((ref: any) => {
            fullContent += `\n[${ref.label}] ${ref.title}\n`;
            if (ref.authors) fullContent += `Auteurs : ${ref.authors}\n`;
            if (ref.journal) fullContent += `Journal : ${ref.journal}\n`;
            if (ref.year) fullContent += `Année : ${ref.year}\n`;
            if (ref.url) fullContent += `URL : ${ref.url}\n`;
          });
        }
      }
      
      fullContent += "\n" + "=".repeat(50) + "\n";
    });

    // Télécharger le fichier
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-complet-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Historique complet exporté !");
  };

  const renderContentWithReferences = (content: string, references: any[]) => {
    // D'abord, formater les références isolées (format "Références : 1234567890")
    let processedContent = content;
    
    // Pattern pour détecter "Références : " suivi de chiffres
    const referencePattern = /Références?\s*:\s*(\d+(?:\d+)*)/gi;
    processedContent = processedContent.replace(referencePattern, (match, nums) => {
      // Séparer les chiffres et les formatter entre crochets
      const refNumbers = nums.match(/\d+/g) || [];
      return `Références : ${refNumbers.map((n: string) => `[${n}]`).join(', ')}`;
    });

    // Ensuite, remplacer les [num] par des liens cliquables dans le Markdown
    references.forEach(ref => {
      const pattern = new RegExp(`\\[${ref.label}\\]`, 'g')
      processedContent = processedContent.replace(pattern, `[${ref.label}](${ref.url})`)
    })

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline" />
            ),
            p: ({ node, ...props }) => <p {...props} className="mb-2" />,
            ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 mb-2" />,
            ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 mb-2" />,
            h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mb-2 mt-4" />,
            h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-bold mb-2 mt-3" />,
            h3: ({ node, ...props }) => <h3 {...props} className="text-base font-bold mb-1 mt-2" />,
            strong: ({ node, ...props }) => <strong {...props} className="font-bold" />,
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    )
  }

  // Fonction pour extraire les informations structurées avec GPT-4.1-mini
  const extractStructuredData = async () => {
    if (!textContent.trim()) {
      toast.error("Veuillez d'abord entrer un cas clinique")
      return
    }

    if (isDemoMode) {
      // En mode démo, simuler l'extraction
      toast.info("Extraction simulée en mode démo...")
      setIsExtractingForm(true)
      
      setTimeout(() => {
        setStructuredForm({
          anamnese: "Douleur thoracique oppressive rétrosternale survenue au repos il y a 2 heures, irradiant vers le bras gauche, accompagnée de sueurs profuses et de nausées.",
          antecedents: "HTA traitée par IEC, dyslipidémie sous statine, tabagisme sevré il y a 5 ans (40 PA). Pas d'antécédent coronarien personnel, mais père décédé d'IDM à 58 ans.",
          examenClinique: "PA 145/90 mmHg, FC 95/min, SpO2 96% AA. Patient en sueurs, douloureux.",
          examensComplementaires: "ECG : sus-décalage ST en V1-V4 de 3mm. Troponine T hs : 450 ng/L (N<14).",
          contextePatient: "Patient de 65 ans, profession non précisée."
        })
        setIsExtractingForm(false)
        toast.success("Extraction terminée (démo)")
      }, 2000)
      
      return
    }

    // Mode réel - appeler GPT-4.1-mini
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
          model: 'gpt-4.1-mini-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant médical expert en extraction d\'informations cliniques. Réponds UNIQUEMENT en JSON valide. IMPORTANT : Toutes les valeurs doivent être des STRINGS simples, pas d\'objets ni de tableaux.'
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

      const extractedData = JSON.parse(response.data.choices[0].message.content)
      console.log('Données extraites par GPT-4o-mini:', extractedData)
      
      // S'assurer que toutes les valeurs sont des strings
      const cleanedData = {
        anamnese: typeof extractedData.anamnese === 'string' ? extractedData.anamnese : JSON.stringify(extractedData.anamnese || 'Non précisé'),
        antecedents: typeof extractedData.antecedents === 'string' ? extractedData.antecedents : JSON.stringify(extractedData.antecedents || 'Non précisé'),
        examenClinique: typeof extractedData.examenClinique === 'string' ? extractedData.examenClinique : JSON.stringify(extractedData.examenClinique || 'Non précisé'),
        examensComplementaires: typeof extractedData.examensComplementaires === 'string' ? extractedData.examensComplementaires : JSON.stringify(extractedData.examensComplementaires || 'Non précisé'),
        contextePatient: typeof extractedData.contextePatient === 'string' ? extractedData.contextePatient : JSON.stringify(extractedData.contextePatient || 'Non précisé')
      }
      
      setStructuredForm(cleanedData)
      toast.success("Informations extraites avec succès")
      
    } catch (error: any) {
      console.error('Erreur extraction GPT-4.1-mini:', error)
      
      // Fallback sur gpt-4o-mini si gpt-4.1-mini n'est pas disponible
      if (error.response?.data?.error?.code === 'model_not_found') {
        try {
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

          const extractedData = JSON.parse(response.data.choices[0].message.content)
          console.log('Données extraites par GPT-4o-mini (fallback):', extractedData)
          
          // S'assurer que toutes les valeurs sont des strings
          const cleanedData = {
            anamnese: typeof extractedData.anamnese === 'string' ? extractedData.anamnese : JSON.stringify(extractedData.anamnese || 'Non précisé'),
            antecedents: typeof extractedData.antecedents === 'string' ? extractedData.antecedents : JSON.stringify(extractedData.antecedents || 'Non précisé'),
            examenClinique: typeof extractedData.examenClinique === 'string' ? extractedData.examenClinique : JSON.stringify(extractedData.examenClinique || 'Non précisé'),
            examensComplementaires: typeof extractedData.examensComplementaires === 'string' ? extractedData.examensComplementaires : JSON.stringify(extractedData.examensComplementaires || 'Non précisé'),
            contextePatient: typeof extractedData.contextePatient === 'string' ? extractedData.contextePatient : JSON.stringify(extractedData.contextePatient || 'Non précisé')
          }
          
          setStructuredForm(cleanedData)
          toast.success("Informations extraites avec succès (gpt-4o-mini)")
        } catch (fallbackError) {
          toast.error("Erreur lors de l'extraction des informations")
        }
      } else {
        toast.error("Erreur lors de l'extraction des informations")
      }
    } finally {
      setIsExtractingForm(false)
    }
  }

  // Fonction pour mettre à jour le texte principal avec le formulaire
  const updateFromStructuredForm = () => {
    let updatedText = "";
    
    if (structuredForm.contextePatient) {
      updatedText += `CONTEXTE PATIENT:\n${structuredForm.contextePatient}\n\n`;
    }
    
    if (structuredForm.anamnese) {
      updatedText += `ANAMNÈSE:\n${structuredForm.anamnese}\n\n`;
    }
    
    if (structuredForm.antecedents) {
      updatedText += `ANTÉCÉDENTS:\n${structuredForm.antecedents}\n\n`;
    }
    
    if (structuredForm.examenClinique) {
      updatedText += `EXAMEN CLINIQUE:\n${structuredForm.examenClinique}\n\n`;
    }
    
    if (structuredForm.examensComplementaires) {
      updatedText += `EXAMENS COMPLÉMENTAIRES:\n${structuredForm.examensComplementaires}`;
    }
    
    setTextContent(updatedText.trim());
    toast.success("Cas clinique mis à jour avec les données structurées");
  }

  // Nouvelles fonctions pour le système de retour et amélioration
  const generateCaseTitle = async (caseText: string) => {
    if (isDemoMode) {
      setCaseTitle("Syndrome coronarien aigu ST+ chez patient de 65 ans");
      return;
    }

    try {
      const prompt = `Génère un titre court et descriptif (max 50 caractères) pour ce cas clinique:\n\n${caseText.substring(0, 500)}`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant médical. Génère uniquement un titre court et descriptif pour le cas clinique. Maximum 50 caractères.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${aiService.getOpenAIApiKey()}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const title = response.data.choices[0].message.content.trim();
      setCaseTitle(title);
    } catch (error) {
      console.error('Erreur génération titre:', error);
      setCaseTitle("Cas clinique");
    }
  }

  const handleAddInformation = (sectionType: string) => {
    setIsEditingSection({ ...isEditingSection, [sectionType]: true });
  }

  const handleCancelEdit = (sectionType: string) => {
    setIsEditingSection({ ...isEditingSection, [sectionType]: false });
    setAdditionalInfo({ ...additionalInfo, [sectionType]: '' });
  }

  const handleSaveAdditionalInfo = async (sectionType: string, shouldRelaunchAnalysis: boolean = false) => {
    const info = additionalInfo[sectionType]
    if (!info?.trim()) {
      toast.error("Veuillez ajouter des informations")
      return
    }

    // Si on veut relancer l'analyse complète
    if (shouldRelaunchAnalysis) {
      if (!user || !userCredits || (userCredits.credits ?? 0) <= 0) {
        toast.error("Crédits insuffisants pour relancer l'analyse")
        return
      }
      
      // Sauvegarder les infos et relancer
      const updatedAnalysisData = {
        ...analysisData,
        modificationHistory: [
          ...(analysisData.modificationHistory || []),
          {
            sectionType,
            additionalInfo: info,
            timestamp: new Date().toISOString(),
            version: currentVersion + 1
          }
        ]
      }
      
      setAnalysisData(updatedAnalysisData)
      setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
      setIsEditingSection({ ...isEditingSection, [sectionType]: false })
      
      // Relancer l'analyse complète
      await handleCompleteReanalysis()
      return
    }

    // Sinon, comportement normal (sauvegarde simple sans ré-analyse)
    setIsEditingSection({ ...isEditingSection, [sectionType]: false })
    
    // Sauvegarder la version actuelle
    const currentAnalysis = {
      ...analysisData,
      version: currentVersion,
      timestamp: new Date().toISOString()
    };
    setAnalysisVersions([...analysisVersions, currentAnalysis]);

    // Créer la nouvelle version avec juste l'information ajoutée
    const newAnalysisData = {
      ...analysisData,
      lastModified: new Date().toISOString(),
      modificationHistory: [
        ...(analysisData.modificationHistory || []),
        {
          sectionType,
          additionalInfo: info,
          timestamp: new Date().toISOString(),
          version: currentVersion + 1
        }
      ],
      version: currentVersion + 1
    };

    setAnalysisData(newAnalysisData);
    setCurrentVersion(currentVersion + 1);
    setAdditionalInfo({ ...additionalInfo, [sectionType]: '' });
    
    // Sauvegarder dans l'historique si l'utilisateur est connecté
    if (user && !analysisData.isDemo) {
      try {
        await HistoryService.saveAnalysis(user.uid, newAnalysisData);
      } catch (saveError) {
        console.error('Erreur lors de la sauvegarde:', saveError);
      }
    }
    
    toast.success("Information ajoutée avec succès !");
  }

  const handleDeepReanalysis = async () => {
    if (!user || !userCredits || (userCredits.credits ?? 0) <= 0) {
      toast.error("Crédits insuffisants pour une analyse approfondie");
      return;
    }

    setIsReanalyzing(true);
    setProgressMessage("Nouvelle recherche approfondie en cours...");

    try {
      // Utiliser un crédit
      await CreditsService.useCredit(user.uid);
      await refreshCredits();

      // Construire le nouveau contexte avec toutes les modifications
      let enrichedContext = analysisData.caseText;
      if (analysisData.modificationHistory?.length > 0) {
        enrichedContext += "\n\nINFORMATIONS COMPLÉMENTAIRES AJOUTÉES:\n";
        analysisData.modificationHistory.forEach((mod: any) => {
          enrichedContext += `- ${sectionTitles[mod.sectionType as keyof typeof sectionTitles]}: ${mod.additionalInfo}\n`;
        });
      }

      // Relancer une analyse complète
      const result = await aiService.analyzeClinicalCase(
        enrichedContext,
        (message) => setProgressMessage(message),
        (section, index, total) => {
          setCurrentSections(prev => [...prev, section]);
        },
        analysisData.images
      );

      // Sauvegarder l'ancienne version
      const currentAnalysis = {
        ...analysisData,
        version: currentVersion,
        timestamp: new Date().toISOString()
      };
      setAnalysisVersions([...analysisVersions, currentAnalysis]);

      // Mettre à jour avec la nouvelle analyse
      const newAnalysisData = {
        ...result,
        id: analysisData.id,
        title: analysisData.title,
        caseText: enrichedContext,
        version: currentVersion + 1,
        isDeepReanalysis: true,
        previousVersions: analysisVersions.length + 1
      };

      setAnalysisData(newAnalysisData);
      setCurrentVersion(currentVersion + 1);
      
      toast.success("Analyse approfondie terminée !");
    } catch (error) {
      console.error('Erreur analyse approfondie:', error);
      toast.error("Erreur lors de l'analyse approfondie");
    } finally {
      setIsReanalyzing(false);
      setProgressMessage("");
    }
  }

  const toggleVersionComparison = () => {
    setShowVersionComparison(!showVersionComparison);
  }

  // Nouvelle fonction pour relancer l'analyse complète (1 crédit)
  const handleCompleteReanalysis = async () => {
    if (!user || !userCredits || (userCredits.credits ?? 0) <= 0 || !analysisData) {
      toast.error("Crédits insuffisants pour relancer l'analyse")
      return
    }

    setIsReanalyzing(true)
    setProgressMessage("Nouvelle analyse complète en cours...")

    try {
      // Utiliser un crédit
      await CreditsService.useCredit(user.uid)
      await refreshCredits()

      // Construire le contexte enrichi avec toutes les modifications
      let enrichedContext = analysisData.caseText || textContent
      if (analysisData.modificationHistory?.length > 0) {
        enrichedContext += "\n\nINFORMATIONS COMPLÉMENTAIRES AJOUTÉES:\n"
        analysisData.modificationHistory.forEach((mod: any) => {
          enrichedContext += `- ${sectionTitles[mod.sectionType as keyof typeof sectionTitles]}: ${mod.additionalInfo}\n`
        })
      }

      // Réinitialiser les sections actuelles
      setCurrentSections([])
      
      // Relancer l'analyse complète
      const result = await aiService.analyzeClinicalCase(
        enrichedContext,
        (message) => setProgressMessage(message),
        (section, index, total) => {
          setCurrentSections(prev => [...prev, section])
        },
        analysisData.images || uploadedImages
      )

      // Conserver l'historique des modifications mais mettre à jour toutes les sections non modifiées
      const manuallyModifiedSections = new Set(
        analysisData.modificationHistory?.map((mod: any) => mod.sectionType) || []
      )

      const updatedSections = result.sections.map((newSection: any) => {
        // Si cette section a été modifiée manuellement, conserver la version modifiée
        if (manuallyModifiedSections.has(newSection.type)) {
          const existingSection = analysisData.sections.find((s: any) => s.type === newSection.type)
          return existingSection || newSection
        }
        // Sinon, utiliser la nouvelle version
        return newSection
      })

      // Sauvegarder l'ancienne version
      const currentAnalysis = {
        ...analysisData,
        version: currentVersion,
        timestamp: new Date().toISOString()
      }
      setAnalysisVersions([...analysisVersions, currentAnalysis])

      // Créer la nouvelle version de l'analyse
      const newAnalysisData = {
        ...result,
        id: analysisData.id,
        title: analysisData.title,
        caseText: enrichedContext,
        sections: updatedSections,
        modificationHistory: analysisData.modificationHistory || [],
        version: currentVersion + 1,
        isCompleteReanalysis: true,
        previousVersions: analysisVersions.length + 1
      }

      setAnalysisData(newAnalysisData)
      setCurrentVersion(currentVersion + 1)
      
      // Sauvegarder dans l'historique
      if (user) {
        try {
          await HistoryService.saveAnalysis(user.uid, newAnalysisData)
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde:', saveError)
        }
      }
      
      toast.success("Analyse complète terminée ! Les sections modifiées manuellement ont été conservées.")
    } catch (error) {
      console.error('Erreur analyse complète:', error)
      toast.error("Erreur lors de l'analyse complète")
    } finally {
      setIsReanalyzing(false)
      setProgressMessage("")
    }
  }

  // Fonction pour gérer l'expansion/fermeture de tous les accordéons
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

                  <div className={`border rounded-lg p-4 ${isDemoMode ? 'bg-orange-50 border-orange-200' : hasApiKeys ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex">
                      <AlertCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${isDemoMode ? 'text-orange-600' : hasApiKeys ? 'text-green-600' : 'text-red-600'}`} />
                      <div className={`text-sm ${isDemoMode ? 'text-orange-800' : hasApiKeys ? 'text-green-800' : 'text-red-800'}`}>
                        <p className="font-medium mb-1">
                          {isDemoMode ? "Mode démonstration activé" : hasApiKeys ? "Mode analyse réelle" : "Clés API manquantes"}
                        </p>
                        <p>
                          {isDemoMode 
                            ? "Cette version affiche un exemple d'analyse préformaté pour illustrer les fonctionnalités."
                            : hasApiKeys
                            ? "Analyse réelle utilisant l'intelligence artificielle pour une analyse médicale approfondie."
                            : "Le système n'est pas configuré pour utiliser le mode réel."
                          }
                        </p>
                        {!isDemoMode && hasApiKeys && (
                          <div className="mt-2 space-y-1">
                            {user ? (
                              <div className="flex items-center gap-2">
                                <Coins className="h-4 w-4" />
                                <span className="font-medium">
                                  Crédits disponibles: {userCredits?.credits || 0}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                <span>Connexion requise pour le mode réel</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
                    {analysisData && !analysisData.isDemo && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">ID :</span> {analysisData.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date :</span> {new Date(analysisData.date).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-600 italic">
                          "{analysisData.title}"
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* Boutons pour la gestion des versions */}
                    {analysisVersions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleVersionComparison}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300"
                      >
                        <GitBranch className="mr-2 h-4 w-4" />
                        Versions ({analysisVersions.length})
                      </Button>
                    )}
                    {/* Bouton reprise approfondie */}
                    {!analysisData?.isDemo && analysisData?.modificationHistory && analysisData.modificationHistory.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeepReanalysis}
                            disabled={isReanalyzing || !user || !userCredits || (userCredits.credits ?? 0) <= 0}
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
                    )}
                    {/* Nouveau bouton pour relancer l'analyse complète */}
                    {!analysisData?.isDemo && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCompleteReanalysis}
                            disabled={isReanalyzing || !user || !userCredits || (userCredits.credits ?? 0) <= 0}
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
                    )}
                    {/* Bouton Export All pour maxime.latry@gmail.com uniquement */}
                    {user?.email === 'maxime.latry@gmail.com' && analysisHistory.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAllHistory}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Export All ({analysisHistory.length})
                      </Button>
                    )}
                    {/* Nouveau bouton Export Chain pour maxime.latry@gmail.com */}
                    {user?.email === 'maxime.latry@gmail.com' && analysisData?.requestChain && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportRequestChain}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Export Chain
                      </Button>
                    )}
                    {!analysisData?.isDemo && analysisData?.perplexityReport && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPerplexityReport}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Rapport de recherche
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsPDF}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsText}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copier
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
                
                {/* Indicateur de ré-analyse en cours */}
                {isReanalyzing && progressMessage && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="font-medium">{progressMessage}</span>
                    </div>
                  </div>
                )}

                {/* Comparaison des versions */}
                {showVersionComparison && analysisVersions.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Historique des versions</CardTitle>
                      <CardDescription>
                        Version actuelle: {currentVersion + 1} | {analysisVersions.length} version(s) précédente(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisVersions.map((version, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">Version {version.version + 1}</span>
                                {version.modificationHistory?.slice(-1).map((mod: any, i: number) => (
                                  <p key={i} className="text-sm text-gray-600 mt-1">
                                    Modification: {sectionTitles[mod.sectionType as keyof typeof sectionTitles]}
                                  </p>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {new Date(version.timestamp).toLocaleString('fr-FR')}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAnalysisData(version)
                                    setCurrentVersion(version.version)
                                    toast.info(`Affichage de la version ${version.version + 1}`)
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Voir
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Nouveau : Dossier initial */}
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
                                  
                                  if (user && !analysisData.isDemo) {
                                    HistoryService.saveAnalysis(user.uid, updatedData).catch(error => {
                                      console.error('Erreur sauvegarde:', error)
                                    })
                                  }
                                }}
                              >
                                Sauvegarder
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (!user || !userCredits || (userCredits.credits ?? 0) <= 0) {
                                    toast.error("Crédits insuffisants")
                                    return
                                  }
                                  const updatedData = {
                                    ...analysisData,
                                    caseText: editedInitialCase
                                  }
                                  setAnalysisData(updatedData)
                                  setEditingInitialCase(false)
                                  await handleCompleteReanalysis()
                                }}
                                disabled={!user || !userCredits || (userCredits.credits ?? 0) <= 0}
                              >
                                Sauvegarder et relancer l'analyse
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
                    // Mode réel - afficher les sections au fur et à mesure avec bouton d'ajout
                    (currentSections.length > 0 ? currentSections : analysisData?.sections || []).map((section: any, index: number) => (
                      <AccordionItem key={index} value={String(index)} className="border rounded-lg">
                        <AccordionTrigger className="px-6 hover:no-underline">
                          <span className="text-left font-medium">
                            {sectionTitles[section.type as keyof typeof sectionTitles]}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          {/* Contenu de la section */}
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
                                    {editingPreviousSection[`${section.type}-${idx}`] && (
                                      <div className="mt-2">
                                        <textarea
                                          value={additionalInfo[`${section.type}-${idx}`] || mod.additionalInfo}
                                          onChange={(e) => setAdditionalInfo({
                                            ...additionalInfo,
                                            [`${section.type}-${idx}`]: e.target.value
                                          })}
                                          className="w-full p-2 border border-blue-300 rounded-md resize-none h-20 text-sm"
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => {
                                              const key = `${section.type}-${idx}`
                                              const newValue = additionalInfo[key]
                                              
                                              if (!newValue?.trim()) {
                                                toast.error("Le texte ne peut pas être vide")
                                                return
                                              }
                                              
                                              // Mettre à jour l'historique des modifications
                                              const updatedHistory = analysisData.modificationHistory.map((mod: any, modIdx: number) => {
                                                if (mod.sectionType === section.type && analysisData.modificationHistory.filter((m: any) => m.sectionType === section.type).indexOf(mod) === idx) {
                                                  return { ...mod, additionalInfo: newValue }
                                                }
                                                return mod
                                              })
                                              
                                              const updatedData = {
                                                ...analysisData,
                                                modificationHistory: updatedHistory
                                              }
                                              
                                              setAnalysisData(updatedData)
                                              setEditingPreviousSection({ ...editingPreviousSection, [key]: false })
                                              setAdditionalInfo({ ...additionalInfo, [key]: '' })
                                              
                                              if (user && !isDemoMode) {
                                                HistoryService.saveAnalysis(user.uid, updatedData).catch(error => {
                                                  console.error('Erreur sauvegarde:', error)
                                                })
                                              }
                                              
                                              toast.success("Modification sauvegardée")
                                            }}
                                          >
                                            Sauvegarder
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setEditingPreviousSection({ ...editingPreviousSection, [`${section.type}-${idx}`]: false })
                                              setAdditionalInfo({ ...additionalInfo, [`${section.type}-${idx}`]: '' })
                                            }}
                                          >
                                            Annuler
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {!editingPreviousSection[`${section.type}-${idx}`] && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="ml-2"
                                        onClick={() => setEditingPreviousSection({ ...editingPreviousSection, [`${section.type}-${idx}`]: true })}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
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
                                  disabled={!additionalInfo[section.type]?.trim() || isReanalyzing}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Ajouter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveAdditionalInfo(section.type, true)}
                                  disabled={!additionalInfo[section.type]?.trim() || isReanalyzing || !user || !userCredits || (userCredits.credits ?? 0) <= 0}
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
                                disabled={isReanalyzing}
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

                {/* Bouton recherche maladies rares */}
                {!analysisData?.isDemo && analysisData?.sections && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={searchRareDiseases}
                      disabled={isSearchingRareDisease}
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSearchingRareDisease ? (
                        <>
                          <Microscope className="mr-2 h-4 w-4 animate-pulse" />
                          Recherche en cours...
                        </>
                      ) : (
                        <>
                          <Microscope className="mr-2 h-4 w-4" />
                          {showRareDiseaseSection ? "Actualiser la recherche de maladies rares" : "Rechercher des maladies rares"}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {isAnalyzing && progressMessage && (
                  <div className="mt-4 text-center text-sm text-gray-600 animate-pulse">
                    {progressMessage}
                  </div>
                )}

                {analysisData && (
                  <>
                    <Card className="mt-8">
                      <CardHeader>
                        <CardTitle>Références bibliographiques</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          {(analysisData?.isDemo ? demoReferences : analysisData?.references || []).map((ref: any) => (
                            <li key={ref.label} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
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
                                    <p className="text-sm text-gray-600 italic mb-1">
                                      <span className="font-medium not-italic">Journal :</span> {ref.journal}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                    {ref.year && (
                                      <span className="bg-gray-200 px-2 py-1 rounded">Année : {ref.year}</span>
                                    )}
                                    {ref.doi && (
                                      <span className="bg-gray-200 px-2 py-1 rounded">DOI : {ref.doi}</span>
                                    )}
                                    {ref.pmid && (
                                      <span className="bg-gray-200 px-2 py-1 rounded">PMID : {ref.pmid}</span>
                                    )}
                                  </div>
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
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Références pour les maladies rares */}
                    {rareDiseaseData && rareDiseaseData.references.length > 0 && (
                      <Card className="mt-8">
                        <CardHeader>
                          <CardTitle>Références - Maladies rares</CardTitle>
                          <CardDescription>Sources spécialisées : Orphanet, OMIM, GeneReviews</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-4">
                            {rareDiseaseData.references.map((ref: any) => (
                              <li key={`rare-${ref.label}`} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r">
                                <div className="flex items-start gap-3">
                                  <span className="text-purple-600 font-bold text-lg min-w-[30px]">[{ref.label}]</span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-base text-gray-900 mb-1">{ref.title}</p>
                                    {ref.authors && (
                                      <p className="text-xs text-gray-600 mb-1">
                                        {ref.authors}
                                      </p>
                                    )}
                                    {ref.journal && (
                                      <p className="text-sm text-gray-600 italic mb-1">
                                        <span className="font-medium not-italic">Journal :</span> {ref.journal}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                      {ref.year && (
                                        <span className="bg-purple-200 px-2 py-1 rounded">Année : {ref.year}</span>
                                      )}
                                      {ref.doi && (
                                        <span className="bg-purple-200 px-2 py-1 rounded">DOI : {ref.doi}</span>
                                      )}
                                      {ref.pmid && (
                                        <span className="bg-purple-200 px-2 py-1 rounded">PMID : {ref.pmid}</span>
                                      )}
                                    </div>
                                    <a
                                      href={ref.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 hover:underline mt-2 font-medium"
                                    >
                                      Consulter la source
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}

// Composant principal avec Suspense
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