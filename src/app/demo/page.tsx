"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Brain, FileText, AlertCircle, ArrowLeft, Copy, ToggleLeft, ToggleRight, Download, FileDown, Mic, MicOff, Pause, Play, ImagePlus, X, Lock, Coins } from "lucide-react"
import { toast } from "sonner"
import { AIClientService } from "@/services/ai-client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useAuth } from "@/contexts/AuthContext"
import { CreditsService } from "@/services/credits"

const sectionTitles = {
  CLINICAL_CONTEXT: "1. Contexte clinique",
  KEY_DATA: "2. Données clés",
  DIAGNOSTIC_HYPOTHESES: "3. Hypothèses diagnostiques",
  COMPLEMENTARY_EXAMS: "4. Examens complémentaires recommandés",
  THERAPEUTIC_DECISIONS: "5. Décisions thérapeutiques",
  PROGNOSIS_FOLLOWUP: "6. Pronostic & suivi",
  PATIENT_EXPLANATIONS: "7. Explications au patient"
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

export default function DemoPage() {
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

  // Vérifier le support audio côté client seulement
  useEffect(() => {
    setIsAudioSupported(AIClientService.isAudioRecordingSupported())
  }, [])

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

        setAnalysisData({
          isDemo: false,
          sections: result.sections,
          references: result.references,
          perplexityReport: result.perplexityReport
        })
        
        const duration = Date.now() - startTime
        toast.success(`Analyse terminée en ${Math.round(duration / 1000)}s !`)
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
    a.download = 'rapport-perplexity.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Rapport Perplexity téléchargé")
  }

  const exportAsPDF = async () => {
    const element = document.getElementById('analysis-results')
    if (!element) return

    toast.info("Génération du PDF en cours...")
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save('analyse-cas-clinique.pdf')
      toast.success("PDF téléchargé")
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF")
      console.error(error)
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analyse de Cas Cliniques</h1>
            <p className="text-gray-600 mt-1">
              {isDemoMode ? "Mode démonstration" : "Mode analyse réelle"}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </Link>
        </div>

        {!showResults ? (
          <Card>
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
                      <ToggleLeft className="h-6 w-6 text-gray-500" />
                    ) : (
                      <ToggleRight className="h-6 w-6 text-blue-600" />
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
                          disabled={isTranscribing}
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
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Exemple : Patient de 65 ans, hypertendu connu, se présente aux urgences pour douleur thoracique..."
                  className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isRecording || isTranscribing}
                />
                {recordingError && (
                  <p className="text-sm text-red-600 mt-2">{recordingError}</p>
                )}
                {isTranscribing && (
                  <p className="text-sm text-gray-600 mt-2 animate-pulse">
                    Transcription en cours...
                  </p>
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
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('images')?.click()}
                      disabled={isAnalyzing}
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

              <div className={`border rounded-lg p-4 ${isDemoMode ? 'bg-blue-50 border-blue-200' : hasApiKeys ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex">
                  <AlertCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${isDemoMode ? 'text-blue-600' : hasApiKeys ? 'text-green-600' : 'text-red-600'}`} />
                  <div className={`text-sm ${isDemoMode ? 'text-blue-800' : hasApiKeys ? 'text-green-800' : 'text-red-800'}`}>
                    <p className="font-medium mb-1">
                      {isDemoMode ? "Mode démonstration" : hasApiKeys ? "Mode analyse réelle" : "Clés API manquantes"}
                    </p>
                    <p>
                      {isDemoMode 
                        ? "Cette version affiche un exemple d'analyse préformaté pour illustrer les fonctionnalités."
                        : hasApiKeys
                        ? "Analyse réelle utilisant Perplexity Academic et OpenAI pour une analyse médicale approfondie."
                        : "Les clés API Perplexity et OpenAI doivent être configurées dans les secrets GitHub pour utiliser le mode réel."
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
                  disabled={isAnalyzing || !textContent.trim() || (!isDemoMode && !hasApiKeys)}
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
              <h2 className="text-2xl font-bold">
                Résultat de l'analyse {analysisData?.isDemo ? "(Démo)" : "(IA)"}
              </h2>
              <div className="flex gap-2">
                {!analysisData?.isDemo && analysisData?.perplexityReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPerplexityReport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Rapport Perplexity
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

            {isAnalyzing && progressMessage && (
              <div className="mt-4 text-center text-sm text-gray-600 animate-pulse">
                {progressMessage}
              </div>
            )}

            {analysisData && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Références bibliographiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(analysisData?.isDemo ? demoReferences : analysisData?.references || []).map((ref: any) => (
                      <li key={ref.label} className="flex items-start gap-2">
                        <span className="text-gray-500">[{ref.label}]</span>
                        <div className="flex-1">
                          <p className="font-medium">{ref.title}</p>
                          {ref.authors && (
                            <p className="text-sm text-gray-600">{ref.authors}</p>
                          )}
                          {ref.journal && (
                            <p className="text-sm text-gray-500 italic">{ref.journal}</p>
                          )}
                          {(ref.doi || ref.pmid) && (
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              {ref.doi && <span>DOI: {ref.doi}</span>}
                              {ref.pmid && <span>PMID: {ref.pmid}</span>}
                            </div>
                          )}
                          {ref.year && (
                            <span className="text-xs text-gray-500">({ref.year})</span>
                          )}
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline block mt-1"
                          >
                            Voir la source →
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 