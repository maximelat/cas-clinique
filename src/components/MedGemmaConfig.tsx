"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Eye, EyeOff, Check, X } from "lucide-react"
import { toast } from "sonner"
import { medGemmaClient } from "@/services/medgemma-client"

export function MedGemmaConfig() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    // Vérifier si une clé est déjà configurée
    setHasKey(medGemmaClient.hasApiKey())
    
    // En développement, récupérer la clé du localStorage si elle existe
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY) {
      const storedKey = localStorage.getItem('medgemma_api_key')
      if (storedKey) {
        setApiKey(storedKey)
      }
    }
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Veuillez entrer une clé API valide")
      return
    }

    // Sauvegarder la clé
    medGemmaClient.setApiKey(apiKey)
    setHasKey(true)
    setIsOpen(false)
    toast.success("Clé API MedGemma configurée avec succès")
  }

  const handleRemove = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medgemma_api_key')
    }
    setApiKey("")
    setHasKey(false)
    toast.info("Clé API MedGemma supprimée")
  }

  // Ne pas afficher en production si la clé est déjà configurée via env
  if (process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          MedGemma
          {hasKey && <Check className="h-3 w-3 text-green-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuration MedGemma</DialogTitle>
          <DialogDescription>
            MedGemma est un modèle d'IA spécialisé pour l'analyse d'images médicales. 
            Configurez votre clé API pour activer l'analyse avancée des images.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Clé API MedGemma</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="hf_XXXXXXXXXXXXXXXXXXXXX"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Obtenez votre clé API sur{" "}
              <a 
                href="https://huggingface.co/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Hugging Face
              </a>
            </p>
          </div>

          {hasKey && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>MedGemma est configuré et prêt à l'emploi</span>
              </div>
            </div>
          )}

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Avantages de MedGemma :</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Analyse spécialisée des radiographies, IRM et scanners</li>
              <li>• Détection précise des anomalies médicales</li>
              <li>• Interprétation des résultats biologiques</li>
              <li>• Analyse détaillée des ECG</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-between">
          {hasKey && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 