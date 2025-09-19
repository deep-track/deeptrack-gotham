"use client";

import { Suspense, useState, useEffect, useRef } from "react";
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

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const orderIdParam = search?.get("orderId");
  const refParam = search?.get("ref");
  const { isLoaded, isSignedIn } = useUser();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 sm:px-8 py-10 max-w-5xl mx-auto space-y-10"
    >
      <Toaster />
      <header className="text-center sm:text-left space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
          AI Media Verification
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
          Upload all media files to verify their
          authenticity using advanced AI detection algorithms.
        </p>
        <hr className="border-t border-[hsl(var(--border))] opacity-20 mt-4" />
      </header>

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
          disabled={selectedFiles.length === 0 || isProcessing}
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
          ) : (
            "Proceed to Checkout"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
