'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AnalysisCard } from '@/components/verification/analysis-card';
import { useDashboardStore } from "@/lib/store";
import { useEffect, useState } from 'react';
import type { ResultData } from '@/lib/store';
import { usePostHog } from 'posthog-js/react';



interface RealityDefenderModel {
  name: string;
  status: "AUTHENTIC" | "MANIPULATED" | "UNKNOWN";
  score: number;
}


export default function Results() {
  return (
    <Suspense fallback={<div className="p-6">Loading results…</div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultData = useDashboardStore((state) => state.resultData);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>('checking');
  const posthog = usePostHog();
  
  const orderId = searchParams.get('orderId');
  const ref = searchParams.get('ref');

  useEffect(() => {
    // If we have orderId or ref, we're coming from payment flow
    if (orderId || ref) {
      checkPaymentStatus();
    } else {
      // Regular flow - just show results from store
      const timer = setTimeout(() => {
        setIsLoading(false);
        
        // Track results viewed
        if (resultData && resultData.length > 0) {
          const firstResult = resultData[0];
          posthog.capture('results_viewed', {
            order_id: orderId || 'unknown',
            verification_status: firstResult.result?.status || 'unknown',
            file_count: resultData.length,
            confidence_score: firstResult.result?.score || 0,
            user_type: 'authenticated'
          });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [orderId, ref]);

  const checkPaymentStatus = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus('checking');
      
      let endpoint = '';
      let targetOrderId = orderId;
      
      if (ref) {
        endpoint = `/api/payments/status/${encodeURIComponent(ref)}`;
      } else if (orderId) {
        endpoint = `/api/orders?orderId=${encodeURIComponent(orderId)}`;
      }

      if (!endpoint) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      
      // If we used payment status endpoint, get orderId from response
      if (ref && data.orderId) {
        targetOrderId = data.orderId;
      }
      
      if (data.status === 'paid' && targetOrderId) {
        setPaymentStatus('paid');
        // Payment confirmed, load results from order
        await loadOrderResults(targetOrderId);
        setIsLoading(false);
        
        // Track purchase confirmed (client-side fallback)
        posthog.capture('purchase_confirmed', {
          order_id: targetOrderId,
          payment_method: 'paystack',
          payment_provider: 'paystack',
          verification_status: 'processing',
          user_type: 'authenticated'
        });
      } else if (data.status === 'paid') {
        // Payment confirmed but no orderId - show success message
        setPaymentStatus('paid');
        setIsLoading(false);
        
        // Track purchase confirmed (client-side fallback)
        posthog.capture('purchase_confirmed', {
          order_id: orderId || 'unknown',
          payment_method: 'paystack',
          payment_provider: 'paystack',
          verification_status: 'processing',
          user_type: 'authenticated'
        });
      } else {
        // Still checking or failed
        setPaymentStatus(data.status || 'pending');
        
        // If still pending, poll again after a delay
        if (data.status === 'pending' || data.status === 'checking') {
          const intervalMs = 8000;
          if (typeof document !== 'undefined' && document.hidden) {
            setTimeout(() => {
              checkPaymentStatus();
            }, intervalMs);
          } else {
            setTimeout(() => {
              checkPaymentStatus();
            }, intervalMs);
          }
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Payment check failed:', error);
      setPaymentStatus('error');
      setIsLoading(false);
    }
  };

  const loadOrderResults = async (orderId: string, attempts: number = 0) => {
    try {
      console.log('Loading order results for:', orderId);
      const response = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`);
      const order = await response.json();
      
      console.log('Order response:', order);
      
      if (order && order.result) {
        console.log('Order has result, converting to ResultData format');
        // Convert order result to ResultData format and add to store
        const resultData = {
          imageBase64: order.result.imageBase64 || '',
          fileMeta: order.result.fileMeta || { name: 'Uploaded file', type: 'image/jpeg', size: 0 },
          result: order.result.analysis || order.result,
          timestamp: order.updatedAt || new Date().toISOString()
        };
        
        console.log('Setting result data:', resultData);
        
        // Clear existing results and add the new one
        useDashboardStore.getState().clearResults();
        useDashboardStore.getState().setResultData(resultData);
        
        console.log('Result data set in store');
      } else {
        console.log('Order has no result data yet, waiting for processing...');
        // Order exists but no results yet - keep polling more slowly and cap attempts
        const MAX_ATTEMPTS = 12; // ~2 minutes if 10s interval
        const INTERVAL_MS = 15000;
        if (attempts >= MAX_ATTEMPTS) {
          console.log('Max attempts reached for loading order results. Stopping.');
          setIsLoading(false);
          return;
        }
        if (typeof document !== 'undefined' && document.hidden) {
          setTimeout(() => loadOrderResults(orderId, attempts + 1), INTERVAL_MS);
        } else {
          setTimeout(() => loadOrderResults(orderId, attempts + 1), INTERVAL_MS);
        }
      }
    } catch (error) {
      console.error('Failed to load order results:', error);
    }
  };

  if (!Array.isArray(resultData) || resultData.length === 0) {
    if (orderId || ref) {
      // Coming from payment flow but no results yet
      return (
        <main className="flex items-center justify-center min-h-[50vh] px-4 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground text-base sm:text-lg">
              {paymentStatus === 'checking' 
                ? 'Verifying payment and preparing results...' 
                : 'Payment verified. Processing your verification results...'}
            </p>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
          </div>
        </main>
      );
    }
    
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
              <h3 className="text-xl font-semibold">
                {orderId || ref ? 'Processing Payment' : 'Verifying Media'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {orderId || ref 
                  ? 'Confirming your payment and preparing verification results...' 
                  : 'Analyzing with advanced AI models...'}
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
