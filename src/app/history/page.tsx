"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Trash2, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { HistoryService, AnalysisRecord } from "@/services/history"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null)

  // Charger l'historique
  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    
    loadAnalyses()
  }, [user, router])

  const loadAnalyses = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const userAnalyses = await HistoryService.getUserAnalyses(user.uid)
      setAnalyses(userAnalyses)
      setFilteredAnalyses(userAnalyses)
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer les analyses
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAnalyses(analyses)
    } else {
      const filtered = analyses.filter(analysis =>
        analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.caseText.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAnalyses(filtered)
    }
  }, [searchTerm, analyses])

  const handleDelete = async () => {
    if (!analysisToDelete || !user) return
    
    try {
      await HistoryService.deleteAnalysis(analysisToDelete, user.uid)
      toast.success("Analyse supprimée")
      loadAnalyses()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
      console.error(error)
    } finally {
      setDeleteDialogOpen(false)
      setAnalysisToDelete(null)
    }
  }

  const openAnalysis = (analysisId: string) => {
    router.push(`/analysis/view?id=${analysisId}`)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historique des analyses</h1>
            <p className="text-gray-600 mt-1">
              Retrouvez toutes vos analyses précédentes
            </p>
          </div>
          <Link href="/demo">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Barre de recherche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des analyses */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                {searchTerm ? "Aucune analyse trouvée pour cette recherche" : "Aucune analyse dans l'historique"}
              </p>
              {!searchTerm && (
                <Link href="/demo">
                  <Button className="mt-4">
                    Nouvelle analyse
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card 
                key={analysis.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openAnalysis(analysis.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {analysis.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(analysis.date.toDate(), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          ID: {analysis.id}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAnalysisToDelete(analysis.id)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {analysis.caseText}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {analysis.sections.length} sections
                    </span>
                    {analysis.images && analysis.images.length > 0 && (
                      <span>
                        {analysis.images.length} image(s)
                      </span>
                    )}
                    {analysis.rareDiseaseData && (
                      <span className="text-purple-600">
                        Maladies rares recherchées
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'analyse sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 