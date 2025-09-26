"use client";

import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { UploadArea } from "@/components/upload/upload-area";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { TokenDisplay } from "@/components/tokens/token-display";
import { InsufficientTokensAlert } from "@/components/tokens/insufficient-tokens-alert";
import { PaymentChoiceDialog } from "@/components/tokens/payment-choice-dialog";
import { useToast } from "@/hooks/use-toast";
import { usePostHog } from "posthog-js/react";

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  // Check if we're in build mode
  const isBuildMode = process.env.NODE_ENV === 'production' && 
    (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key'));

  if (isBuildMode) {
    return (
      <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600">This page is not available during build.</p>
        </div>
      </div>
    );
  }

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const posthog = usePostHog();
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const router = useRouter();
  const search = useSearchParams();
  const orderIdParam = search?.get("orderId");
  const refParam = search?.get("ref");
  const { isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();

  // Fetch user token data
  const fetchUserTokens = async () => {
    if (!isSignedIn) {
      setLoadingTokens(false);
      return;
    }

    try {
      const response = await fetch("/api/purchase-tokens");
      if (response.ok) {
        const data = await response.json();
        setUserTokens(data.tokens);
        setIsDemoUser(data.isDemoUser);
      }
    } catch (error) {
      console.error("Error fetching user tokens:", error);
    } finally {
      setLoadingTokens(false);
    }
  };

  // Fetch tokens when user signs in
  useEffect(() => {
    if (isLoaded) {
      fetchUserTokens();
    }
  }, [isLoaded, isSignedIn]);

  // If the user was redirected back from the payment provider, poll the
  // verification endpoint and resume to results when the payment is confirmed.
  useEffect(() => {
    // Only run when we have either an orderId or a reference.
    if (!orderIdParam && !refParam) return;

    let cancelled = false;
    const maxAttempts = 10;
    const intervalMs = 20000;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        // If tab not visible, try again later without fetching
        setTimeout(poll, intervalMs);
        return;
      }
      try {
        let status: string | null = null;

        // Prefer verifying by transaction reference (authoritative)
        if (refParam) {
          try {
            const resp = await fetch(
              `/api/payments/status/${encodeURIComponent(refParam)}`,
            );
            if (resp.ok) {
              const json = await resp.json();
              status = (json.status as string) ?? null;
            }
          } catch (err) {
            console.warn(
              "verify-by-ref failed, will fallback to order check",
              err,
            );
          }
        }

        // Fallback: check order status
        if (!status && orderIdParam) {
          try {
            const resp = await fetch(
              `/api/orders?orderId=${encodeURIComponent(orderIdParam)}`,
            );
            if (resp.ok) {
              const json = await resp.json();
              status = json?.status ?? null;
            }
          } catch (err) {
            console.warn("order check failed", err);
          }
        }

        // If payment confirmed, navigate to results (include identifiers)
        if (status === "paid") {
          const params = new URLSearchParams();
          if (orderIdParam) params.set("orderId", orderIdParam);
          if (refParam) params.set("ref", refParam);
          // Send user to results so processing / result UI can resume
          setTimeout(() => {
            router.push(`/results?${params.toString()}`);
          }, 2000)
          return;
        }
      } catch (err) {
        console.error("payment polling error:", err);
      }

      attempts++;
      if (attempts < maxAttempts && !cancelled) {
        setTimeout(poll, intervalMs);
      } else {
        // Give up after max attempts; UI can display retry option on payment-pending page.
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [orderIdParam, refParam, router]);

  // Intentionally do NOT redirect to login on mount.
  // Users can upload and preview first. Sign-in is required at checkout.

  /**
   * handleProceed
   * - Uploads files to /api/uploads (multipart).
   * - Creates an Order on the server with returned upload IDs.
   * - Redirects to /checkout?orderId=<id>
   *
   * Backend expectations:
   *  - POST /api/uploads (form-data 'media') -> { uploadId, filename, size, mime }
   *  - POST /api/orders { uploads: string[] } -> { orderId, totalAmount }
   *
   * For large files, swap this for a presigned S3 flow.
   */
  const handleProceed = async () => {
    if (selectedFiles.length === 0) return;

    // Track file upload started
    posthog.capture('file_upload_started', {
      file_count: selectedFiles.length,
      total_file_size: selectedFiles.reduce((sum, file) => sum + file.size, 0),
      file_types: selectedFiles.map(file => file.type),
      user_type: isSignedIn ? 'authenticated' : 'anonymous'
    });

    // For signed-in users with tokens, show payment choice dialog
    if (isSignedIn && !isDemoUser && userTokens !== null && userTokens > 0) {
      setIsProcessing(true);
      
      try {
        // Upload files first
        const uploadPromises = selectedFiles.map(async (file: File) => {
          const formData = new FormData();
          formData.append("media", file);

          const resp = await fetch("/api/uploads", {
            method: "POST",
            body: formData,
          });

          if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`Upload failed for ${file.name}: ${resp.status} ${text}`);
          }

          return resp.json();
        });

        const settled = await Promise.allSettled(uploadPromises);
        const succeeded = settled
          .filter((r) => r.status === "fulfilled")
          .map((r: any) => r.value);

        if (succeeded.length === 0) {
          toast({
            title: "Upload failed",
            description: "All files failed to upload. Please try again.",
            variant: "destructive"
          });
          
          // Track upload failure
          posthog.capture('file_upload_failed', {
            file_count: selectedFiles.length,
            error_type: 'all_uploads_failed',
            user_type: 'authenticated'
          });
          return;
        }

        // Track successful file upload
        posthog.capture('file_upload_completed', {
          file_count: succeeded.length,
          total_file_size: selectedFiles.reduce((sum, file) => sum + file.size, 0),
          file_types: selectedFiles.map(file => file.type),
          user_type: 'authenticated',
          upload_method: 'token_payment_choice'
        });

        setUploadedFiles(succeeded);
        setShowPaymentChoice(true);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload files",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // For demo users or users without tokens, proceed with normal flow
    // Persist selected files metadata locally so the checkout can show previews.
    useDashboardStore.getState().setFiles(selectedFiles);

    setIsProcessing(true);

    try {
      // Upload each file to server (simple multipart endpoint).
      const uploadPromises = selectedFiles.map(async (file: File) => {
        const formData = new FormData();
        formData.append("media", file);

        const resp = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(
            `Upload failed for ${file.name}: ${resp.status} ${text}`,
          );
        }

        // Expected shape from server: { uploadId, filename, size, mime }
        return resp.json();
      });

      const settled = await Promise.allSettled(uploadPromises);

      const succeeded = settled
        .filter((r) => r.status === "fulfilled")
        // @ts-ignore - narrowing of PromiseAllSettled is verbose; this is fine here
        .map((r) => r.value);

      const failed = settled.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.warn("Some uploads failed:", failed);
        // Replace with your toast system if available
        alert(
          `${failed.length} file(s) failed to upload. Check console for details.`,
        );
      }

      if (succeeded.length === 0) {
        // If nothing uploaded, stop here.
        setIsProcessing(false);
        return;
      }

      // Create an Order referencing these uploaded items.
      const orderResp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploads: succeeded.map((u: any) => u.uploadId || u.id),
        }),
      });

      if (!orderResp.ok) {
        const text = await orderResp.text().catch(() => "");
        throw new Error(`Failed to create order: ${orderResp.status} ${text}`);
      }

      const { orderId } = await orderResp.json();

      // Redirect to checkout page to complete sign-in/payment.
      router.push(`/checkout?orderId=${encodeURIComponent(orderId)}`);
    } catch (err) {
      console.error("Error during proceed:", err);
      // TODO: wire up toast instead of alert
      alert(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayWithTokens = async () => {
    try {
      // Track token payment method selected
      posthog.capture('payment_method_selected', {
        payment_method: 'tokens',
        file_count: uploadedFiles.length,
        user_type: 'authenticated',
        token_balance: userTokens
      });

      // Create order for token-based payment
      const orderResp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploads: uploadedFiles.map((u: any) => u.uploadId || u.id),
        }),
      });

      if (!orderResp.ok) {
        const text = await orderResp.text().catch(() => "");
        throw new Error(`Failed to create order: ${orderResp.status} ${text}`);
      }

      const { orderId } = await orderResp.json();

      // Track checkout started for token payment
      posthog.capture('checkout_started', {
        cart_id: orderId,
        user_type: 'business_user',
        payment_method: 'tokens',
        page_type: 'dashboard',
        order_value: uploadedFiles.length * 100, // Assuming 100 tokens per file
        currency: 'KES'
      });

      // Process order immediately for token payment
      const processResp = await fetch("/api/process-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!processResp.ok) {
        throw new Error("Failed to process order");
      }

      const result = await processResp.json();
      
      // Track token usage
      posthog.capture('token_used', {
        order_id: orderId,
        token_amount: uploadedFiles.length,
        token_balance_after: userTokens ? userTokens - uploadedFiles.length : 0,
        verification_type: 'media_verification'
      });
      
      // Store result and redirect to results page
      useDashboardStore.getState().setResultData(result);
      router.push(`/results?orderId=${encodeURIComponent(orderId)}`);
    } catch (error) {
      // Track token payment failure
      posthog.capture('payment_failed', {
        payment_method: 'tokens',
        error_message: error instanceof Error ? error.message : "Unexpected error",
        file_count: uploadedFiles.length,
        user_type: 'authenticated'
      });
      
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Failed to process token payment",
        variant: "destructive"
      });
    }
  };

  const handlePayWithCard = async () => {
    try {
      // Create order for card payment
      const orderResp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploads: uploadedFiles.map((u: any) => u.uploadId || u.id),
        }),
      });

      if (!orderResp.ok) {
        const text = await orderResp.text().catch(() => "");
        throw new Error(`Failed to create order: ${orderResp.status} ${text}`);
      }

      const { orderId } = await orderResp.json();

      // Redirect to checkout for card payment
      router.push(`/checkout?orderId=${encodeURIComponent(orderId)}`);
    } catch (error) {
      toast({
        title: "Order creation failed",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 sm:px-8 py-10 max-w-5xl mx-auto space-y-10"
    >
      <Toaster />
      <header className="text-center sm:text-left space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
              AI Media Verification
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
              Upload all media files to verify their
              authenticity using advanced AI detection algorithms.
            </p>
          </div>
          
          {/* Token Display for Mobile/Tablet */}
          {isSignedIn && (
            <div className="xl:hidden">
              <TokenDisplay showPurchaseButton={false} />
            </div>
          )}
        </div>
        <hr className="border-t border-[hsl(var(--border))] opacity-20 mt-4" />
      </header>

      {/* Insufficient Tokens Alert */}
      {isSignedIn && !loadingTokens && !isDemoUser && userTokens !== null && userTokens < 1 && (
        <InsufficientTokensAlert 
          currentTokens={userTokens} 
          requiredTokens={1}
          className="mb-6"
        />
      )}

      {/* Upload Section */}
      <div className="relative rounded-[var(--radius-lg)] p-[2px] bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0]">
        <div className="rounded-[inherit] bg-[rgb(10,10,10)] dark:bg-[rgb(10,10,10)]">
          <Card className="w-full bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] rounded-[var(--radius-lg)] shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition hover:shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl font-semibold">
                Upload Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <UploadArea
                onFileSelect={(files) => setSelectedFiles(files)}
                selectedFiles={selectedFiles}
                onClearFiles={() => setSelectedFiles([])}
              />
              <p className="text-xs text-muted-foreground">
                  Max file size: 300MB.  
                  Accepted formats: JPG, PNG, MP3, WAV, WebP, MP4, WebM, MOV, AVI, WMV, MKV, FLV.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div>
        <Button
          onClick={handleProceed}
          disabled={
            selectedFiles.length === 0 || 
            isProcessing || 
            (isSignedIn && !isDemoUser && (userTokens === null || userTokens < 1))
          }
          className={cn(
            "w-full",
            "bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70",
            "text-[hsl(var(--primary-foreground))]",
            "text-base font-medium py-5 rounded-[var(--radius)]",
            "shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isSignedIn && !isDemoUser && (userTokens === null || userTokens < 1) ? (
            "Purchase Tokens to Continue"
          ) : (
            "Proceed to Checkout"
          )}
        </Button>
      </div>

      {/* Payment Choice Dialog */}
      <PaymentChoiceDialog
        isOpen={showPaymentChoice}
        onClose={() => setShowPaymentChoice(false)}
        onPayWithTokens={handlePayWithTokens}
        onPayWithCard={handlePayWithCard}
        fileCount={uploadedFiles.length}
        userTokens={userTokens || 0}
        isDemoUser={isDemoUser}
      />
    </motion.div>
  );
}
