'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push('/demo?mode=real');
    }
  }, [user, router]);

  const features = [
    "3 analyses gratuites à l'inscription",
    "Analyses par IA médicale avancée avec rasionnement",
    "Rapport complet avec références scientifiques",
    "Sauvegarde de vos analyses dans l'historique",
    "Export PDF et partage des résultats"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Créez votre compte</CardTitle>
            <CardDescription className="text-base">
              Inscrivez-vous pour analyser vos cas cliniques avec l'IA
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Avantages */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Offre de bienvenue</span>
              </div>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bouton Google SSO */}
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Connexion...' : 'Continuer avec Google'}
            </Button>

            {/* Mentions légales */}
            <p className="text-xs text-gray-500 text-center">
              En vous inscrivant, vous acceptez nos conditions d'utilisation. 
              Cet outil est destiné aux professionnels de santé uniquement.
            </p>
          </CardContent>
        </Card>

        {/* Lien mode démo */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous voulez d'abord tester ?{' '}
            <Link href="/demo?mode=demo" className="text-blue-600 hover:underline font-medium">
              Essayer le mode démo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 