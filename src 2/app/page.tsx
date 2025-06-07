import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, FileText, Shield, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Clinical Case Analyzer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Analysez vos cas cliniques avec l'intelligence artificielle
          </p>
          <Link href="/demo">
            <Button size="lg" className="text-lg px-8 py-6">
              Essayer la démo
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <Brain className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Analyse IA Avancée</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Utilisation de Perplexity Academic et OpenAI o3 pour une analyse complète et structurée de vos cas cliniques
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>7 Sections Structurées</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Contexte clinique, données clés, hypothèses diagnostiques, examens, décisions thérapeutiques, pronostic et explications patient
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Sécurisé & Confidentiel</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Données chiffrées, conformité RGPD, authentification sécurisée
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <Zap className="w-12 h-12 text-yellow-600 mb-4 mx-auto" />
              <CardTitle>Version Démo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg">
                Cette version de démonstration permet de tester l'interface et les fonctionnalités. 
                Pour une utilisation complète avec authentification et stockage sécurisé, contactez-nous.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
