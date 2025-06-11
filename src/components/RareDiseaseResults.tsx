import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { BookOpen, AlertTriangle, Microscope, FileSearch, Target, Pill, Hospital } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface RareDiseaseResultsProps {
  data: {
    disease: string
    report: string
    references: any[]
  }
}

export default function RareDiseaseResults({ data }: RareDiseaseResultsProps) {
  // Fonction pour nettoyer le texte des références inline
  const cleanTextFromReferences = (text: string) => {
    return text.replace(/\[\d+\]/g, '').trim()
  }
  
  // Fonction pour extraire les références d'un texte
  const extractReferencesFromText = (text: string) => {
    const refs: string[] = []
    const regex = /\[(\d+)\]/g
    let match
    while ((match = regex.exec(text)) !== null) {
      refs.push(match[1])
    }
    return [...new Set(refs)]
  }
  
  return (
    <div className="space-y-6">
      {/* En-tête avec le nom de la maladie */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Microscope className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-purple-900">
                  {data.disease || "Analyse des maladies rares"}
                </CardTitle>
                <p className="text-sm text-purple-700 mt-1">
                  ** 1/250 000 à 1/1 000 000 naissances
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Maladie Rare
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      {/* Rapport complet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-blue-600" />
            Analyse des maladies rares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
                h2: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h4 className="text-sm font-bold mt-2 mb-1" {...props} />,
                p: ({ node, ...props }) => <p className="mb-3" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                a: ({ node, ...props }) => {
                  const href = props.href || ''
                  if (href.startsWith('#')) {
                    return <span className="text-purple-600 font-medium">{props.children}</span>
                  }
                  return <a className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
                }
              }}
            >
              {data.report}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
      
      {/* Références spécialisées */}
      {data.references?.length > 0 && (
        <Accordion type="multiple" className="mt-6">
          <AccordionItem value="rare-references" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline bg-purple-50">
              <span className="text-left font-medium flex items-center gap-2 text-purple-900">
                <BookOpen className="h-4 w-4" />
                Références spécialisées ({data.references.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="space-y-4 mt-4">
                {data.references.map((ref: any) => (
                  <li key={ref.label} id={`rare-ref-${ref.label}`} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r">
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
                            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 hover:underline mt-2 font-medium"
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
      )}
    </div>
  )
} 