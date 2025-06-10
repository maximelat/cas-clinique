"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Brain, FileText, AlertCircle, ArrowLeft, Copy, ToggleLeft, ToggleRight, Download, FileDown, Mic, MicOff, Pause, Play, ImagePlus, X, Lock, Coins, Microscope, History } from "lucide-react"
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
    
    if (isDemoMode) {
      toast.info("Analyse en mode démonstration...")
      // Mode démo - afficher les données prédéfinies après un délai
      setTimeout(() => {
        setIsAnalyzing(false)
        setShowResults(true)
        setAnalysisData({ isDemo: true })
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
        const result = await aiService.analyzeClinicalCase(
          textContent,
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
          title: analysisTitle,
          date: new Date().toISOString(),
          isDemo: false,
          caseText: textContent,
          sections: result.sections,
          references: result.references,
          perplexityReport: result.perplexityReport,
          images: uploadedImages.length > 0 ? uploadedImages : undefined
        }
        
        setAnalysisData(analysisData)
        
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
    let content = `ANALYSE DE CAS CLINIQUE\n${new Date().toLocaleDateString('fr-FR')}\n\n${'='.repeat(50)}\n\n`
    
    if (analysisData?.isDemo) {
      Object.entries(demoSections).forEach(([key, text]) => {
        content += `${sectionTitles[key as keyof typeof sectionTitles]}\n${'-'.repeat(40)}\n${text}\n\n`
      })
    } else if (analysisData?.sections) {
      const sections = currentSections.length > 0 ? currentSections : analysisData.sections
      sections.forEach((section: any) => {
        content += `${sectionTitles[section.type as keyof typeof sectionTitles]}\n${'-'.repeat(40)}\n${section.content}\n\n`
      })
    }
    
    // Ajouter la section maladies rares si présente
    if (rareDiseaseData && showRareDiseaseSection) {
      content += `\n8. Recherche de maladies rares\n${'-'.repeat(40)}\n${rareDiseaseData.report}\n\n`
    }
    
    // Ajouter les références
    content += `\nRÉFÉRENCES BIBLIOGRAPHIQUES\n${'='.repeat(50)}\n\n`
    const references = analysisData?.isDemo ? demoReferences : (analysisData?.references || [])
    references.forEach((ref: any) => {
      content += `[${ref.label}] ${ref.title}\n`
      if (ref.authors) content += `    Auteurs: ${ref.authors}\n`
      if (ref.journal) content += `    Journal: ${ref.journal}\n`
      if (ref.year) content += `    Année: ${ref.year}\n`
      if (ref.url && ref.url !== '#') content += `    URL: ${ref.url}\n`
      content += '\n'
    })
    
    // Ajouter les références maladies rares si présentes
    if (rareDiseaseData && rareDiseaseData.references.length > 0) {
      content += `\nRÉFÉRENCES - MALADIES RARES\n${'='.repeat(50)}\n\n`
      rareDiseaseData.references.forEach((ref: any) => {
        content += `[${ref.label}] ${ref.title}\n`
        if (ref.url && ref.url !== '#') content += `    URL: ${ref.url}\n`
        content += '\n'
      })
    }
    
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analyse-cas-clinique.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Fichier texte téléchargé")
  }

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
      
      // Ajouter la section aux sections actuelles
      setCurrentSections(prev => [...prev, {
        type: 'RARE_DISEASES',
        content: result.report
      }])

      toast.success("Recherche de maladies rares terminée")
      
      // Mettre à jour l'analyse dans l'historique si elle existe
      if (analysisData && analysisData.id && user) {
        try {
          const updatedAnalysis = {
            ...analysisData,
            rareDiseaseData: result
          }
          await HistoryService.saveAnalysis(user.uid, updatedAnalysis)
          setAnalysisData(updatedAnalysis)
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

  const renderContentWithReferences = (content: string, references: any[]) => {
    // Remplacer les [num] par des liens cliquables dans le Markdown
    let processedContent = content

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
            
            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="0">
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
                      {renderContentWithReferences(section.content, analysisData?.references || [])}
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
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">Auteurs :</span> {ref.authors}
                                  </p>
                                )}
                                {ref.journal && (
                                  <p className="text-sm text-gray-600 italic mb-1">
                                    <span className="font-medium not-italic">Journal :</span> {ref.journal}
                                  </p>
                                )}
                                {ref.year && (
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="bg-purple-200 px-2 py-1 rounded">Année : {ref.year}</span>
                                  </div>
                                )}
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