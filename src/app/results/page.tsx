'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { AnalysisCard } from '@/components/verification/analysis-card'
import { useDashboardStore } from "@/lib/store"
import { useEffect, useState } from 'react'

interface ResultProps {
  imageBase64: string
  fileMeta: { name: string; type: string; size?: number }
  result: { isAuthentic: boolean }
  timestamp: string
}

export default function Results() {
  const router = useRouter()
  const resultData = useDashboardStore((state) => state.resultData)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading delay (replace with actual loading state from your verification process)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // 2 seconds delay for demonstration
    return () => clearTimeout(timer)
  }, [])

  // If no results, show fallback
  if (!Array.isArray(resultData) || resultData.length === 0) {
    return (
      <main className="flex items-center justify-center min-h-[50vh] px-4 text-center">
        <div className="space-y-4">
          <p className="text-muted-foreground text-base sm:text-lg">
            No result data found. Please upload and verify an image first.
          </p>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </div>
      </main>
    )
  }

  // Helper for formatting date
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Verifying Media</h3>
              <p className="text-muted-foreground max-w-md">
                Analyzing ...
              </p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-4">
                <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Verification Results</h1>
        
        <div className="grid grid-cols-1 gap-8">
          {resultData.map((result: ResultProps, idx: number) => {
            const { imageBase64, fileMeta, result: analysis, timestamp } = result

            const analysisResults = [
              {
                name: 'Face Video Fake Detector Baseline',
                description: 'Detects videos of faces that are manipulated using state-of-the-art baseline',
                status: analysis.isAuthentic ? 'authentic' : 'fake',
                confidence: analysis.isAuthentic ? undefined : 100,
              },
              {
                name: 'Face Video Fake Detector',
                description: 'Detects videos manipulated using video model ensemble',
                status: 'not-applicable',
              },
              {
                name: 'Image Manipulation Detector',
                description: 'Detects warping artifacts in manipulated images',
                status: 'not-applicable',
              },
              {
                name: 'All Purpose Image Fake Detector',
                description: 'Detects GAN-manipulated images',
                status: 'not-applicable',
              },
              {
                name: 'Generative Face Detector',
                description: 'AI manipulated images via ensemble',
                status: analysis.isAuthentic ? 'authentic' : 'fake',
                confidence: analysis.isAuthentic ? undefined : 100,
              },
              {
                name: 'Advanced Speech Spoof Detector',
                description: 'Detects AI-manipulated audio with advanced features',
                status: analysis.isAuthentic ? 'authentic' : 'fake',
                confidence: analysis.isAuthentic ? undefined : 100,
              },
            ]

            return (
              <div key={idx} className="bg-card rounded-xl shadow-sm border p-6">
                {/* Header with image and basic info */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="w-full md:w-1/3">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden border bg-muted/10 relative">
                      <Image
                        src={imageBase64}
                        alt={`Uploaded media: ${fileMeta.name}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{fileMeta.name.replace(/\.[^/.]+$/, '')}</h2>
                        <p className="text-sm text-muted-foreground">
                          {fileMeta.type} • {fileMeta.size ? (fileMeta.size / 1024).toFixed(1) : 'N/A'} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                          Back
                        </Button>
                        <Button size="sm" className="bg-black text-white" onClick={() => router.push('/')}>
                          Done
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">Uploaded Date</dt>
                        <dd className="mt-1">{formatDate(timestamp)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Authenticity</dt>
                        <dd className="mt-1">
                          {analysis.isAuthentic ? (
                            <span className="text-green-600 font-semibold">Authentic</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Fake</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Type</dt>
                        <dd className="mt-1">Image</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Format</dt>
                        <dd className="mt-1">{fileMeta.type.split('/')[1]?.toUpperCase() || 'JPG'}</dd>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-muted-foreground mb-2">Helpful Tips</h3>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span>🔍</span>
                          <span>Read the model descriptions for better understanding</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📸</span>
                          <span>Use high-resolution, uncompressed media for best accuracy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🔗</span>
                          <span>Cross-reference results with other sources when needed</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Analysis Results Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Analysis Results</h2>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="w-4 h-4" />
                      PDF Report
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.map((item, i) => (
                      <AnalysisCard
                        key={i}
                        name={item.name}
                        description={item.description}
                        status={item.status}
                        confidence={item.confidence}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}