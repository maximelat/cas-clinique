"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Download, FileDown, FileText, Copy, Calendar, Microscope, Plus, RefreshCw, GitBranch, Edit, ChevronUp, ChevronDown, Info, Eye } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { HistoryService, AnalysisRecord } from "@/services/history"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { AIClientService } from "@/services/ai-client"
import { CreditsService } from "@/services/credits"
import { Timestamp } from "firebase/firestore"

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

function AnalysisView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const id = searchParams.get('id')
  
  // Nouveaux états pour la réanalyse
  const [isEditingSection, setIsEditingSection] = useState<{ [key: string]: boolean }>({})
  const [additionalInfo, setAdditionalInfo] = useState<{ [key: string]: string }>({})
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [progressMessage, setProgressMessage] = useState("")
  const [userCredits, setUserCredits] = useState<{ credits: number } | null>(null)
  const [analysisVersions, setAnalysisVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState(0)
  const [showVersionComparison, setShowVersionComparison] = useState(false)
  
  // Nouveaux états
  const [showInitialCase, setShowInitialCase] = useState(false)
  const [expandAllAccordions, setExpandAllAccordions] = useState(false)
  const [accordionValues, setAccordionValues] = useState<string[]>([])
  const [editingPreviousSection, setEditingPreviousSection] = useState<{ [key: string]: boolean }>({})
  const [editingInitialCase, setEditingInitialCase] = useState(false)
  const [editedInitialCase, setEditedInitialCase] = useState("")
  
  const aiService = new AIClientService()

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    
    loadAnalysis()
  }, [user, id, router])

  // Charger les crédits utilisateur
  useEffect(() => {
    if (user) {
      refreshCredits()
    }
  }, [user])

  const refreshCredits = async () => {
    if (!user) return
    try {
      const credits = await CreditsService.getUserCredits(user.uid)
      setUserCredits(credits)
    } catch (error) {
      console.error('Erreur chargement crédits:', error)
    }
  }

  const loadAnalysis = async () => {
    if (!id) return
    
    try {
      setIsLoading(true)
      const analysisData = await HistoryService.getAnalysis(id)
      
      if (!analysisData) {
        toast.error("Analyse non trouvée")
        router.push("/history")
        return
      }
      
      // Vérifier que l'analyse appartient à l'utilisateur
      if (analysisData.userId !== user?.uid) {
        toast.error("Accès non autorisé")
        router.push("/history")
        return
      }
      
      setAnalysis(analysisData)
    } catch (error) {
      toast.error("Erreur lors du chargement de l'analyse")
      console.error(error)
      router.push("/history")
    } finally {
      setIsLoading(false)
    }
  }

  const renderContentWithReferences = (content: string, references: any[]) => {
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

  const copyToClipboard = () => {
    if (!analysis) return
    
    let fullText = analysis.sections.map((section: any) => 
      `${sectionTitles[section.type as keyof typeof sectionTitles]}\n\n${section.content}`
    ).join("\n\n---\n\n")
    
    if (analysis.rareDiseaseData) {
      fullText += `\n\n---\n\n8. Recherche de maladies rares\n\n${analysis.rareDiseaseData.report}`
    }
    
    navigator.clipboard.writeText(fullText)
    toast.success("Copié dans le presse-papier")
  }

  const downloadReport = () => {
    if (!analysis?.perplexityReport) return

    const content = `RAPPORT DE RECHERCHE ACADÉMIQUE\n\n${analysis.perplexityReport.answer}\n\n` +
      `RÉFÉRENCES:\n${analysis.references.map((ref: any) => 
        `[${ref.label}] ${ref.title}\n${ref.url}`
      ).join('\n\n')}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-recherche-${analysis.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Rapport de recherche téléchargé")
  }

  const exportAsText = () => {
    if (!analysis) return
    
    let content = `ANALYSE DE CAS CLINIQUE\n${format(analysis.date.toDate(), "dd MMMM yyyy à HH:mm", { locale: fr })}\nID: ${analysis.id}\n\n${'='.repeat(50)}\n\n`
    
    analysis.sections.forEach((section: any) => {
      content += `${sectionTitles[section.type as keyof typeof sectionTitles]}\n${'-'.repeat(40)}\n${section.content}\n\n`
    })
    
    if (analysis.rareDiseaseData) {
      content += `\n8. Recherche de maladies rares\n${'-'.repeat(40)}\n${analysis.rareDiseaseData.report}\n\n`
    }
    
    content += `\nRÉFÉRENCES BIBLIOGRAPHIQUES\n${'='.repeat(50)}\n\n`
    analysis.references.forEach((ref: any) => {
      content += `[${ref.label}] ${ref.title}\n`
      if (ref.authors) content += `    Auteurs: ${ref.authors}\n`
      if (ref.journal) content += `    Journal: ${ref.journal}\n`
      if (ref.year) content += `    Année: ${ref.year}\n`
      if (ref.url && ref.url !== '#') content += `    URL: ${ref.url}\n`
      content += '\n'
    })
    
    if (analysis.rareDiseaseData && analysis.rareDiseaseData.references?.length > 0) {
      content += `\nRÉFÉRENCES - MALADIES RARES\n${'='.repeat(50)}\n\n`
      analysis.rareDiseaseData.references.forEach((ref: any) => {
        content += `[${ref.label}] ${ref.title}\n`
        if (ref.url && ref.url !== '#') content += `    URL: ${ref.url}\n`
        content += '\n'
      })
    }
    
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analyse-${analysis.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Fichier texte téléchargé")
  }

  const exportAsPDF = async () => {
    const element = document.getElementById('analysis-results')
    if (!element || !analysis) {
      toast.error("Impossible de trouver le contenu à exporter")
      return
    }

    toast.info("Génération du PDF en cours...")
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = margin
      
      // Titre
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Analyse de Cas Clinique', margin, yPosition)
      yPosition += 10
      
      // Métadonnées
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(format(analysis.date.toDate(), "dd MMMM yyyy à HH:mm", { locale: fr }), margin, yPosition)
      yPosition += 5
      pdf.text(`ID: ${analysis.id}`, margin, yPosition)
      yPosition += 10
      
      // Ligne de séparation
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      // Sections
      pdf.setFontSize(12)
      analysis.sections.forEach((section: any) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = margin
        }
        
        pdf.setFont('helvetica', 'bold')
        const title = sectionTitles[section.type as keyof typeof sectionTitles]
        pdf.text(title, margin, yPosition)
        yPosition += 8
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        
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
      
      // Sauvegarder
      pdf.save(`analyse-${analysis.id}.pdf`)
      toast.success("PDF téléchargé avec succès")
      
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error)
      toast.error("Erreur lors de la génération du PDF")
    }
  }

  // Nouvelles fonctions pour la réanalyse
  const handleAddInformation = (sectionType: string) => {
    setIsEditingSection({ ...isEditingSection, [sectionType]: true })
  }

  const handleCancelEdit = (sectionType: string) => {
    setIsEditingSection({ ...isEditingSection, [sectionType]: false })
    setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
  }

  const handleSaveAdditionalInfo = async (sectionType: string, shouldRelaunchAnalysis: boolean = false) => {
    if (!analysis || !user) return
    
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
      const updatedAnalysis = {
        ...analysis,
        modificationHistory: [
          ...(analysis.modificationHistory || []),
          {
            sectionType,
            additionalInfo: info,
            timestamp: new Date().toISOString(),
            version: currentVersion + 1
          }
        ]
      }
      
      await HistoryService.updateAnalysis(analysis.id, updatedAnalysis)
      setAnalysis(updatedAnalysis)
      setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
      setIsEditingSection({ ...isEditingSection, [sectionType]: false })
      
      // Relancer l'analyse complète
      await handleCompleteReanalysis()
      return
    }

    // Comportement normal (sauvegarde simple sans ré-analyse)
    setIsEditingSection({ ...isEditingSection, [sectionType]: false })
    
    // Sauvegarder la version actuelle
    const currentAnalysis = {
      ...analysis,
      version: currentVersion,
      timestamp: new Date().toISOString()
    }
    setAnalysisVersions([...analysisVersions, currentAnalysis])

    // Créer la nouvelle version avec juste l'information ajoutée
    const newAnalysisData = {
      ...analysis,
      lastModified: Timestamp.fromDate(new Date()),
      modificationHistory: [
        ...(analysis.modificationHistory || []),
        {
          sectionType,
          additionalInfo: info,
          timestamp: new Date().toISOString(),
          version: currentVersion + 1
        }
      ],
      version: currentVersion + 1
    }

    // Sauvegarder dans Firebase
    await HistoryService.updateAnalysis(analysis.id, newAnalysisData)
    
    setAnalysis(newAnalysisData)
    setCurrentVersion(currentVersion + 1)
    setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
    
    toast.success("Information ajoutée avec succès !")
  }

  const handleDeepReanalysis = async () => {
    if (!user || !userCredits || (userCredits.credits ?? 0) <= 0 || !analysis) {
      toast.error("Crédits insuffisants pour une analyse approfondie")
      return
    }

    setIsReanalyzing(true)
    setProgressMessage("Nouvelle recherche approfondie en cours...")

    try {
      // Utiliser un crédit
      await CreditsService.useCredit(user.uid)
      await refreshCredits()

      // Construire le nouveau contexte avec toutes les modifications
      let enrichedContext = analysis.caseText
      if (analysis.modificationHistory && analysis.modificationHistory.length > 0) {
        enrichedContext += "\n\nINFORMATIONS COMPLÉMENTAIRES AJOUTÉES:\n"
        analysis.modificationHistory.forEach((mod: any) => {
          enrichedContext += `- ${sectionTitles[mod.sectionType as keyof typeof sectionTitles]}: ${mod.additionalInfo}\n`
        })
      }

      // Relancer une analyse complète
      const result = await aiService.analyzeClinicalCase(
        enrichedContext,
        (message) => setProgressMessage(message),
        undefined,
        analysis.images
      )

      // Sauvegarder l'ancienne version
      const currentAnalysis = {
        ...analysis,
        version: currentVersion,
        timestamp: new Date().toISOString()
      }
      setAnalysisVersions([...analysisVersions, currentAnalysis])

      // Mettre à jour avec la nouvelle analyse
      const newAnalysisData = {
        ...result,
        id: analysis.id,
        userId: analysis.userId,
        date: analysis.date,
        title: analysis.title,
        caseText: enrichedContext,
        version: currentVersion + 1,
        isDeepReanalysis: true,
        previousVersions: analysisVersions.length + 1
      }

      // Sauvegarder dans Firebase
      await HistoryService.updateAnalysis(analysis.id, newAnalysisData)
      
      setAnalysis(newAnalysisData)
      setCurrentVersion(currentVersion + 1)
      
      toast.success("Analyse approfondie terminée !")
    } catch (error) {
      console.error('Erreur analyse approfondie:', error)
      toast.error("Erreur lors de l'analyse approfondie")
    } finally {
      setIsReanalyzing(false)
      setProgressMessage("")
    }
  }

  const toggleVersionComparison = () => {
    setShowVersionComparison(!showVersionComparison)
  }

  // Nouvelle fonction pour relancer l'analyse complète (1 crédit)
  const handleCompleteReanalysis = async () => {
    if (!user || !userCredits || (userCredits.credits ?? 0) <= 0 || !analysis) {
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
      let enrichedContext = analysis.caseText
      if (analysis.modificationHistory && analysis.modificationHistory.length > 0) {
        enrichedContext += "\n\nINFORMATIONS COMPLÉMENTAIRES AJOUTÉES:\n"
        analysis.modificationHistory.forEach((mod: any) => {
          enrichedContext += `- ${sectionTitles[mod.sectionType as keyof typeof sectionTitles]}: ${mod.additionalInfo}\n`
        })
      }
      
      // Relancer l'analyse complète
      const result = await aiService.analyzeClinicalCase(
        enrichedContext,
        (message) => setProgressMessage(message),
        undefined,
        analysis.images
      )

      // Conserver l'historique des modifications mais mettre à jour toutes les sections non modifiées
      const manuallyModifiedSections = new Set(
        analysis.modificationHistory?.map((mod: any) => mod.sectionType) || []
      )

      const updatedSections = result.sections.map((newSection: any) => {
        // Si cette section a été modifiée manuellement, conserver la version modifiée
        if (manuallyModifiedSections.has(newSection.type)) {
          const existingSection = analysis.sections.find((s: any) => s.type === newSection.type)
          return existingSection || newSection
        }
        // Sinon, utiliser la nouvelle version
        return newSection
      })

      // Sauvegarder l'ancienne version
      const currentAnalysis = {
        ...analysis,
        version: currentVersion,
        timestamp: new Date().toISOString()
      }
      setAnalysisVersions([...analysisVersions, currentAnalysis])

      // Créer la nouvelle version de l'analyse
      const newAnalysisData = {
        ...result,
        id: analysis.id,
        userId: analysis.userId,
        date: analysis.date,
        title: analysis.title,
        caseText: enrichedContext,
        sections: updatedSections,
        modificationHistory: analysis.modificationHistory || [],
        version: currentVersion + 1,
        isCompleteReanalysis: true,
        previousVersions: analysisVersions.length + 1
      }

      // Sauvegarder dans Firebase
      await HistoryService.updateAnalysis(analysis.id, newAnalysisData)
      
      setAnalysis(newAnalysisData)
      setCurrentVersion(currentVersion + 1)
      
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
      const allValues = analysis?.sections?.map((_, index) => String(index)) || []
      
      // Ajouter la section des maladies rares si elle existe
      if (analysis?.rareDiseaseData) {
        allValues.push('rare-diseases')
      }
      
      setAccordionValues(allValues)
    }
    setExpandAllAccordions(!expandAllAccordions)
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analyse sauvegardée</h1>
              <p className="text-gray-600 mt-1">
                {format(analysis.date.toDate(), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
            <Link href="/history">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'historique
              </Button>
            </Link>
          </div>

          <div id="analysis-results">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{analysis.title}</CardTitle>
                <CardDescription>
                  ID: {analysis.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  {analysis.modificationHistory && analysis.modificationHistory.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeepReanalysis}
                          disabled={isReanalyzing || !user || (userCredits?.credits ?? 0) <= 0}
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCompleteReanalysis}
                        disabled={isReanalyzing || !user || (userCredits?.credits ?? 0) <= 0}
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
                  {analysis.perplexityReport && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadReport}
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
                </div>
              </CardContent>
            </Card>
            
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
                                setAnalysis(version)
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
                            onClick={async () => {
                              const updatedData = {
                                ...analysis,
                                caseText: editedInitialCase
                              }
                              await HistoryService.updateAnalysis(analysis.id, updatedData)
                              setAnalysis(updatedData)
                              setEditingInitialCase(false)
                              toast.success("Dossier initial modifié")
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
                                ...analysis,
                                caseText: editedInitialCase
                              }
                              await HistoryService.updateAnalysis(analysis.id, updatedData)
                              setAnalysis(updatedData)
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
                          {analysis.caseText}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setEditingInitialCase(true)
                            setEditedInitialCase(analysis.caseText)
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
              {analysis.sections.map((section: any, index: number) => (
                <AccordionItem key={index} value={String(index)} className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <span className="text-left font-medium">
                      {sectionTitles[section.type as keyof typeof sectionTitles]}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    {/* Contenu de la section */}
                    <div className="mb-4">
                      {renderContentWithReferences(section.content, analysis.references || [])}
                    </div>
                    
                    {/* Afficher les modifications précédentes s'il y en a */}
                    {analysis.modificationHistory && analysis.modificationHistory.filter((mod: any) => mod.sectionType === section.type).length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4" />
                          Informations ajoutées précédemment :
                        </Label>
                        {analysis.modificationHistory
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
                                        const updatedHistory = analysis.modificationHistory.map((mod: any, modIdx: number) => {
                                          if (mod.sectionType === section.type && analysis.modificationHistory.filter((m: any) => m.sectionType === section.type).indexOf(mod) === idx) {
                                            return { ...mod, additionalInfo: newValue }
                                          }
                                          return mod
                                        })
                                        
                                        const updatedData = {
                                          ...analysis,
                                          modificationHistory: updatedHistory
                                        }
                                        
                                        HistoryService.updateAnalysis(analysis.id, updatedData).then(() => {
                                          setAnalysis(updatedData)
                                          setEditingPreviousSection({ ...editingPreviousSection, [key]: false })
                                          setAdditionalInfo({ ...additionalInfo, [key]: '' })
                                          toast.success("Modification sauvegardée")
                                        }).catch(error => {
                                          console.error('Erreur sauvegarde:', error)
                                          toast.error("Erreur lors de la sauvegarde")
                                        })
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
                            disabled={!additionalInfo[section.type]?.trim() || isReanalyzing || !user || (userCredits?.credits ?? 0) <= 0}
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
              ))}
              
              {analysis.rareDiseaseData && (
                <AccordionItem value="rare-diseases" className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <span className="text-left font-medium flex items-center gap-2">
                      <Microscope className="h-4 w-4 text-purple-600" />
                      8. Recherche de maladies rares
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    {renderContentWithReferences(
                      analysis.rareDiseaseData.report, 
                      analysis.rareDiseaseData.references || []
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Références bibliographiques</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {analysis.references.map((ref: any) => (
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

            {analysis.rareDiseaseData && analysis.rareDiseaseData.references?.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Références - Maladies rares</CardTitle>
                  <CardDescription>Sources spécialisées : Orphanet, OMIM, GeneReviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {analysis.rareDiseaseData.references.map((ref: any) => (
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
          </div>
        </div>
      </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AnalysisView />
    </Suspense>
  )
} 