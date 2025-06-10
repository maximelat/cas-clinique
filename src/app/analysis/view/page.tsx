"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, Download, FileDown, FileText, Copy, Calendar, Microscope, Plus, RefreshCw, GitBranch } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { HistoryService, AnalysisRecord } from "@/services/history"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Label } from "@/components/ui/label"
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

  const handleSaveAdditionalInfo = async (sectionType: string) => {
    if (!analysis || !user) return
    
    const info = additionalInfo[sectionType]
    if (!info?.trim()) {
      toast.error("Veuillez ajouter des informations")
      return
    }

    setIsEditingSection({ ...isEditingSection, [sectionType]: false })
    setIsReanalyzing(true)
    setProgressMessage("Amélioration de l'analyse en cours...")

    try {
      // Sauvegarder la version actuelle
      const currentAnalysis = {
        ...analysis,
        version: currentVersion,
        timestamp: new Date().toISOString()
      }
      setAnalysisVersions([...analysisVersions, currentAnalysis])

      // Préparer le contexte pour la ré-analyse
      const currentSection = analysis.sections.find((s: any) => s.type === sectionType)
      const allSections = analysis.sections.map((s: any) => 
        `${sectionTitles[s.type as keyof typeof sectionTitles]}:\n${s.content}`
      ).join('\n\n')

      const prompt = `Tu as analysé ce cas clinique et produit l'analyse suivante:

CAS CLINIQUE ORIGINAL:
${analysis.caseText}

ANALYSE COMPLÈTE:
${allSections}

RÉFÉRENCES DISPONIBLES:
${analysis.references.map((ref: any) => `[${ref.label}] ${ref.title} - ${ref.url}`).join('\n')}

L'utilisateur a ajouté ces INFORMATIONS COMPLÉMENTAIRES pour la section "${sectionTitles[sectionType as keyof typeof sectionTitles]}":
${info}

INSTRUCTIONS:
1. Intègre ces nouvelles informations dans la section spécifiée
2. Ajuste si nécessaire les autres sections qui pourraient être impactées
3. Utilise EXACTEMENT le même format que l'analyse originale
4. Conserve toutes les références [X] existantes
5. Retourne UNIQUEMENT le contenu amélioré de la section, sans répéter le titre`

      // Appeler o3 pour améliorer l'analyse
      const response = await aiService.improveAnalysisWithO3(prompt)
      
      // Mettre à jour la section
      const updatedSections = analysis.sections.map((section: any) => {
        if (section.type === sectionType) {
          return { ...section, content: response }
        }
        return section
      })

      // Créer la nouvelle version
      const newAnalysisData = {
        ...analysis,
        sections: updatedSections,
        lastModified: Timestamp.fromDate(new Date()),
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

      // Sauvegarder dans Firebase
      await HistoryService.updateAnalysis(analysis.id, newAnalysisData)
      
      setAnalysis(newAnalysisData)
      setCurrentVersion(currentVersion + 1)
      setAdditionalInfo({ ...additionalInfo, [sectionType]: '' })
      
      toast.success("Section améliorée avec succès !")
    } catch (error) {
      console.error('Erreur amélioration:', error)
      toast.error("Erreur lors de l'amélioration de l'analyse")
    } finally {
      setIsReanalyzing(false)
      setProgressMessage("")
    }
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
                )}
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
                        <span className="font-medium">Version {version.version + 1}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(version.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {version.modificationHistory?.slice(-1).map((mod: any, i: number) => (
                        <p key={i} className="text-sm text-gray-600 mt-1">
                          Modification: {sectionTitles[mod.sectionType as keyof typeof sectionTitles]}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="0">
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
                          onClick={() => handleSaveAdditionalInfo(section.type)}
                          disabled={!additionalInfo[section.type]?.trim() || isReanalyzing}
                        >
                          Améliorer l'analyse
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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