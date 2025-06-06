"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Brain, FileText, AlertCircle, ArrowLeft, Copy, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { AIClientService } from "@/services/ai-client"

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

  // Vérifier si les clés API sont disponibles
  const aiService = new AIClientService()
  const hasApiKeys = aiService.hasApiKeys()

  const handleAnalyze = async () => {
    if (!textContent.trim()) {
      toast.error("Veuillez entrer un cas clinique")
      return
    }

    setIsAnalyzing(true)
    setProgressMessage("")
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

      toast.info("Analyse en cours avec l'IA...")
      
      try {
        const result = await aiService.analyzeClinicalCase(
          textContent,
          (message) => setProgressMessage(message)
        )

        setAnalysisData({
          isDemo: false,
          sections: result.sections,
          references: result.references,
          perplexityReport: result.perplexityReport
        })
        setShowResults(true)
        
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

  const renderContentWithReferences = (content: string, references: any[]) => {
    return content.split(/(\[\d+\])/).map((part, index) => {
      const match = part.match(/\[(\d+)\]/)
      if (match) {
        const refNum = match[1]
        const reference = references.find(ref => ref.label === refNum)
        if (reference) {
          return (
            <a
              key={index}
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title={reference.title}
            >
              {part}
            </a>
          )
        }
      }
      return part
    })
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
              Retour
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
                <Label htmlFor="content">Cas clinique</Label>
                <textarea
                  id="content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Exemple : Patient de 65 ans, hypertendu connu, se présente aux urgences pour douleur thoracique..."
                  className="w-full h-64 p-4 mt-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                        ? "Analyse réelle utilisant Perplexity Academic et OpenAI GPT-4 pour une analyse médicale approfondie."
                        : "Les clés API Perplexity et OpenAI doivent être configurées dans les secrets GitHub pour utiliser le mode réel."
                      }
                    </p>
                    {!isDemoMode && hasApiKeys && (
                      <p className="mt-1 text-xs">
                        Note : Les appels API se font directement depuis le navigateur.
                      </p>
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
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Résultat de l'analyse {analysisData?.isDemo ? "(Démo)" : "(IA)"}
              </h2>
              <div className="flex gap-2">
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
                  }}
                >
                  Nouvelle analyse
                </Button>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {analysisData?.isDemo ? (
                // Mode démo - afficher les sections prédéfinies
                Object.entries(demoSections).map(([key, content]) => (
                  <AccordionItem key={key} value={key} className="border rounded-lg">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <span className="text-left font-medium">
                        {sectionTitles[key as keyof typeof sectionTitles]}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap">
                          {renderContentWithReferences(content, demoReferences)}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                // Mode réel - afficher les sections de l'API
                analysisData?.sections?.map((section: any, index: number) => (
                  <AccordionItem key={index} value={section.type} className="border rounded-lg">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <span className="text-left font-medium">
                        {sectionTitles[section.type as keyof typeof sectionTitles]}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap">
                          {renderContentWithReferences(section.content, analysisData.references || [])}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>

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
                        {(ref.doi || ref.pmid) && (
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            {ref.doi && <span>DOI: {ref.doi}</span>}
                            {ref.pmid && <span>PMID: {ref.pmid}</span>}
                          </div>
                        )}
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Voir la source →
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
} 