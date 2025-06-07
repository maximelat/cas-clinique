import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Brain className="h-16 w-16 mx-auto mb-6 text-blue-600" />
        <h1 className="text-4xl font-bold mb-4">Analyseur de Cas Cliniques</h1>
        <p className="text-xl text-gray-600 mb-8">
          Analyse IA avancée de vos cas médicaux
        </p>
        <Link href="/demo">
          <Button size="lg" className="text-lg px-8 py-6">
            Commencer l'analyse
          </Button>
        </Link>
      </div>
    </div>
  );
}
