"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Brain, FileText, AlertCircle, ArrowLeft, Copy } from "lucide-react"
import { toast } from "sonner"

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

  const handleAnalyze = () => {
    if (!textContent.trim()) {
      toast.error("Veuillez entrer un cas clinique")
      return
    }

    setIsAnalyzing(true)
    toast.info("Analyse en cours...")

    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowResults(true)
      toast.success("Analyse terminée !")
    }, 3000)
  }

  const copyToClipboard = () => {
    const fullText = Object.entries(demoSections).map(([key, content]) => 
      `${sectionTitles[key as keyof typeof sectionTitles]}\n\n${content}`
    ).join("\n\n---\n\n")
    
    navigator.clipboard.writeText(fullText)
    toast.success("Copié dans le presse-papier")
  }

  const renderContentWithReferences = (content: string) => {
    return content.split(/(\[\d+\])/).map((part, index) => {
      const match = part.match(/\[(\d+)\]/)
      if (match) {
        const refNum = match[1]
        const reference = demoReferences.find(ref => ref.label === refNum)
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
            <h1 className="text-3xl font-bold text-gray-900">Mode Démonstration</h1>
            <p className="text-gray-600 mt-1">Testez l'analyse de cas cliniques</p>
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
              <CardTitle>Entrez votre cas clinique</CardTitle>
              <CardDescription>
                Collez ou tapez le cas clinique à analyser
              </CardDescription>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Mode démonstration</p>
                    <p>Cette version affiche un exemple d'analyse préformaté pour illustrer les fonctionnalités.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !textContent.trim()}
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
              <h2 className="text-2xl font-bold">Résultat de l'analyse</h2>
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
                  }}
                >
                  Nouvelle analyse
                </Button>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {Object.entries(demoSections).map(([key, content]) => (
                <AccordionItem key={key} value={key} className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <span className="text-left font-medium">
                      {sectionTitles[key as keyof typeof sectionTitles]}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap">
                        {renderContentWithReferences(content)}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Références bibliographiques</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {demoReferences.map((ref) => (
                    <li key={ref.label} className="flex items-start gap-2">
                      <span className="text-gray-500">[{ref.label}]</span>
                      <div className="flex-1">
                        <p className="font-medium">{ref.title}</p>
                        {ref.authors && (
                          <p className="text-sm text-gray-600">{ref.authors}</p>
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