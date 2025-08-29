'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AnalysisCard } from '@/components/verification/analysis-card';
import { useDashboardStore } from "@/lib/store";
import { useEffect, useState } from 'react';
import type { ResultData } from '@/lib/store';



interface RealityDefenderModel {
  name: string;
  status: "AUTHENTIC" | "MANIPULATED" | "UNKNOWN";
  score: number;
}


export default function Results() {
  const router = useRouter();
  const resultData = useDashboardStore((state) => state.resultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AUTHENTIC':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'MANIPULATED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AUTHENTIC':
        return 'text-green-600';
      case 'MANIPULATED':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

const convertToAnalysisCard = (model: RealityDefenderModel) => {
  const modelDescriptions: { [key: string]: string } = {
    'rd-context-img': 'Context-aware image analysis for detecting manipulations',
    'rd-pine-img': 'Pine model for detecting AI-generated and manipulated images',
    'rd-oak-img': 'Oak model specialized in deepfake detection',
    'rd-elm-img': 'Elm model for general image manipulation detection',
    'rd-img-ensemble': 'Ensemble model combining multiple detection algorithms',
    'rd-cedar-img': 'Cedar model for detecting synthetic content',
  };

  let status: 'authentic' | 'manipulated' | 'not-applicable';
  if (model.status === 'AUTHENTIC') status = 'authentic';
  else if (model.status === 'MANIPULATED') status = 'manipulated';
  else status = 'not-applicable'; 

  return {
    name: model.name.replace('rd-', '').replace('-img', '').toUpperCase() + ' Model',
    description: modelDescriptions[model.name] || 'Advanced AI model for content verification',
    status,
    confidence: Math.round(model.score * 100),
  };
};

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
                Analyzing with advanced AI models...
              </p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-4">
                <div
                  className="bg-primary h-2.5 rounded-full animate-pulse"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <h1 className="text-3xl p-4 sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
          Results
        </h1>

        <div className="grid grid-cols-1 gap-8">
          {resultData.map((result: ResultData, idx: number) => {
            const { imageBase64, fileMeta, result: analysis, timestamp } = result;

            return (
              <div
                key={idx}
                className="bg-card rounded-xl shadow-sm border p-6"
              >
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
                        <h2 className="text-xl font-semibold">
                          {fileMeta.name.replace(/\.[^/.]+$/, '')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {fileMeta.type} •{' '}
                          {fileMeta.size
                            ? (fileMeta.size / 1024).toFixed(1)
                            : 'N/A'}{' '}
                          KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/')}
                        >
                          Back
                        </Button>
                        <Button
                          size="sm"
                          className="bg-black text-white"
                          onClick={() => router.push('/')}
                        >
                          Done
                        </Button>
                      </div>
                    </div>

                    {/* Overall Status */}
                    <div className="mb-6 p-4 rounded-lg border bg-muted/5">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(analysis.status)}
                        <h3 className="text-lg font-semibold">Overall Result</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <dt className="font-medium text-muted-foreground">Status</dt>
                          <dd className={`mt-1 font-semibold ${getStatusColor(analysis.status)}`}>
                            {analysis.status}
                          </dd>
                        </div>
<div>
  <dt className="font-medium text-muted-foreground">Confidence Score</dt>
  <dd className="mt-1 font-semibold">
    {typeof analysis.score === "number"
      ? `${(analysis.score * 100).toFixed(1)}%`
      : "N/A"}
  </dd>
</div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Request ID</dt>
                          <dd className="mt-1 text-xs font-mono">
                            {(analysis.raw as { requestId?: string })?.requestId || 'N/A'}
                          </dd>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">
                          Uploaded Date
                        </dt>
                        <dd className="mt-1">{formatDate(timestamp)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">
                          Models Used
                        </dt>
                        <dd className="mt-1">
                          {analysis.models?.length || 0} AI Models
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">
                          Type
                        </dt>
                        <dd className="mt-1">Image</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">
                          Format
                        </dt>
                        <dd className="mt-1">
                          {fileMeta.type.split('/')[1]?.toUpperCase() || 'JPG'}
                        </dd>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-muted-foreground mb-2">
                        deeptrack™ is an advanced deepfake detection solution designed for media outlets, financial institutions, and government agencies.

                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span>🔍</span>
                          <span>
                            Advanced AI models trained on millions of authentic and manipulated images
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📸</span>
                          <span>
                            Ensemble approach using multiple specialized detection algorithms
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🔗</span>
                          <span>
                            Real-time detection of deepfakes, AI-generated content, and manipulations
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Individual Model Results */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Model Analysis Results</h2>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="w-4 h-4" />
                      PDF Report
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.models?.map((model, i) => {
                      const cardData = convertToAnalysisCard(model);
                      return (
                        <AnalysisCard
                          key={i}
                          name={cardData.name}
                          description={cardData.description}
                          status={cardData.status}
                          confidence={cardData.confidence}
                        />
                      );
                    })}
                  </div>

                  {/* Raw Data Section (for debugging) */}
                  <div className="mt-8 p-4 bg-muted/10 rounded-lg">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-muted-foreground mb-2">
                        Raw API Response (for developers)
                      </summary>
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(analysis.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
