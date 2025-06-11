"use client"

import { Suspense } from "react"

function DemoPageContent() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold">Demo Page</h1>
        <p>This page is temporarily under maintenance.</p>
      </div>
    </div>
  )
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <DemoPageContent />
    </Suspense>
  )
} 