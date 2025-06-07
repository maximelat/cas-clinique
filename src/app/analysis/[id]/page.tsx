"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, Download, FileDown, FileText, Copy, Calendar, Microscope } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { HistoryService, AnalysisRecord } from "@/services/history"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    
    loadAnalysis()
  }, [user, params.id, router])

  const loadAnalysis = async () => {
    if (!params.id || typeof params.id !== 'string') return
    
    try {
      setIsLoading(true)
      const analysisData = await HistoryService.getAnalysis(params.id)
      
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
          
          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="0">
            {analysis.sections.map((section: any, index: number) => (
              <AccordionItem key={index} value={String(index)} className="border rounded-lg">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <span className="text-left font-medium">
                    {sectionTitles[section.type as keyof typeof sectionTitles]}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {renderContentWithReferences(section.content, analysis.references || [])}
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
              <ul className="space-y-3">
                {analysis.references.map((ref: any) => (
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

          {analysis.rareDiseaseData && analysis.rareDiseaseData.references?.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Références - Maladies rares</CardTitle>
                <CardDescription>Sources spécialisées : Orphanet, OMIM, GeneReviews</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.rareDiseaseData.references.map((ref: any) => (
                    <li key={`rare-${ref.label}`} className="flex items-start gap-2">
                      <span className="text-purple-600">[{ref.label}]</span>
                      <div className="flex-1">
                        <p className="font-medium">{ref.title}</p>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline block mt-1"
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
      </div>
    </div>
  )
} 