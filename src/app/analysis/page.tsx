"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function AnalysisRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      // Rediriger vers la vraie page d'analyse
      router.push(`/analysis/view?id=${id}`)
    } else {
      // Pas d'ID, retourner à l'historique
      router.push('/history')
    }
  }, [searchParams, router])
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function AnalysisRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AnalysisRedirect />
    </Suspense>
  )
} 