'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { AnalysisCard } from '@/components/verification/analysis-card'
import { useDashboardStore } from "@/lib/store"


interface ResultProps {
  imageBase64: string
  fileMeta: { name: string; type: string }
  result: { isAuthentic: boolean }
  timestamp: string
}

export default function Results() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data')
  const parsed: ResultProps | null = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : null

  if (!parsed?.imageBase64 || !parsed?.result || !parsed?.fileMeta) {
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

  const { imageBase64, fileMeta, result, timestamp } = parsed

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const analysisResults = [
    {
      name: 'Face Video Fake Detector Baseline',
      description: 'Detects videos of faces that are manipulated using state-of-the-art baseline',
      status: result.isAuthentic ? 'authentic' : 'fake',
      confidence: result.isAuthentic ? undefined : 100,
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
      status: result.isAuthentic ? 'authentic' : 'fake',
      confidence: result.isAuthentic ? undefined : 100,
    },
    {
      name: 'Advanced Speech Spoof Detector',
      description: 'Detects AI-manipulated audio with advanced features',
      status: result.isAuthentic ? 'authentic' : 'fake',
      confidence: result.isAuthentic ? undefined : 100,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-base sm:text-lg font-semibold truncate text-muted-foreground">
              Media Name: <span className="text-foreground">{fileMeta.name.replace(/\.[^/.]+$/, '')}</span>
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button size="sm" className="bg-black text-white" onClick={() => router.push('/')}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-responsive px-4 py-6 sm:py-8 space-y-10">
        {/* Image and Meta */}
        <section aria-labelledby="media-details" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
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

          <div className="space-y-6">
            <div>
              <h2 id="media-details" className="text-lg font-semibold text-muted-foreground mb-2">
                Media Details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">File Name</dt>
                  <dd className="mt-1 break-words">{fileMeta.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Uploaded Date</dt>
                  <dd className="mt-1">{formatDate(timestamp)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Type</dt>
                  <dd className="mt-1">Image</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Format</dt>
                  <dd className="mt-1">{fileMeta.type.split('/')[1]?.toUpperCase() || 'JPG'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-base font-semibold text-muted-foreground mb-2">Helpful Tips</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>🔍 Read the model descriptions for better understanding.</li>
                <li>📸 Use high-resolution, uncompressed media for best accuracy.</li>
                <li>🔗 Cross-reference results with other sources when needed.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Analysis Section */}
        <section aria-labelledby="analysis-results" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="analysis-results" className="text-lg font-semibold">
              Analysis Results
            </h2>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              PDF Report
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisResults.map((item, idx) => (
              <AnalysisCard
                key={idx}
                name={item.name}
                description={item.description}
                status={item.status}
                confidence={item.confidence}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
