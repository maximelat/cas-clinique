'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain, Search, FileText, Image, Shield, Clock, ChevronRight, Sparkles, UserCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Recherche Académique",
      description: "Analyse basée sur la littérature médicale récente et les guidelines internationales"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "IA Médicale Avancée",
      description: "Modèles o3 et o4-mini d'OpenAI spécialisés dans l'analyse clinique"
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: "Analyse d'Imagerie",
      description: "Interprétation d'images médicales, résultats biologiques et ECG"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Rapport Structuré",
      description: "7 sections complètes avec références scientifiques"
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Explications Patient",
      description: "Version vulgarisée pour faciliter la communication"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Gain de Temps",
      description: "Analyse complète en moins de 2 minutes"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Décrivez le cas",
      description: "Entrez l'histoire clinique, les symptômes et ajoutez des images médicales"
    },
    {
      number: "2",
      title: "L'IA analyse",
      description: "Recherche dans la littérature et analyse par IA médicale spécialisée"
    },
    {
      number: "3",
      title: "Rapport complet",
      description: "Recevez une analyse structurée avec références et recommandations"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by OpenAI o3 & Perplexity</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Analyseur de Cas Cliniques
            <span className="text-blue-600"> par IA</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Obtenez une analyse médicale complète avec hypothèses diagnostiques, 
            examens recommandés et plan thérapeutique en quelques secondes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-xl"
              onClick={() => {
                if (user) {
                  router.push('/demo?mode=real');
                } else {
                  router.push('/auth');
                }
              }}
            >
              Essayer gratuitement <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2"
              onClick={() => router.push('/demo?mode=demo')}
            >
              <Stethoscope className="mr-2 h-5 w-5" /> Mode Démo
            </Button>
          </div>
          
          <p className="text-gray-500">
            <Shield className="inline h-4 w-4 mr-1" />
            Aucune inscription requise • 3 analyses offertes
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Une analyse médicale complète et structurée
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Combine la puissance de la recherche académique et de l'IA médicale
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-6 -right-4 h-6 w-6 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à analyser votre premier cas ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Découvrez la puissance de l'IA médicale appliquée à vos cas cliniques
          </p>
          <Link href="/demo">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100 shadow-xl">
              Commencer maintenant <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer note */}
      <footer className="py-8 px-4 text-center text-gray-500 text-sm">
        <p>
          ⚠️ Cet outil est destiné à assister les professionnels de santé. 
          Il ne remplace pas le jugement clinique.
        </p>
      </footer>
    </div>
  );
}
