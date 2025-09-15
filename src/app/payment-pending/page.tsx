"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading payment status…</div>}>
      <PaymentPendingContent />
    </Suspense>
  );
}

function PaymentPendingContent() {
  const search = useSearchParams();
  const router = useRouter();
  const orderId = search.get("orderId");
  const ref = search.get("ref");

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);

  const MAX_ATTEMPTS = 20;
  const POLL_INTERVAL_MS = 3000;

  const cancelledRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    cancelledRef.current = false;
    setAttempts(0);
    setError(null);
    setLoading(true);

    const cleanup = () => {
      cancelledRef.current = true;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };

    const poll = async () => {
      // stop if cancelled
      if (cancelledRef.current) return;

      try {
        const result = await checkOnce();
        // checkOnce may redirect already by updating status -> 'paid'
        setLoading(false);

        if (result === "paid") {
          // redirect to results page with orderId and reference so the results page can resume processing
          router.push(
            `/results?orderId=${encodeURIComponent(orderId ?? "")}&ref=${encodeURIComponent(ref ?? "")}`,
          );
          return;
        }

        // Not paid yet: schedule next attempt
        setAttempts((a) => a + 1);
        if (attempts + 1 >= MAX_ATTEMPTS) {
          setError(
            "Verification timed out. If you completed payment, wait a moment and refresh or contact support.",
          );
          return;
        }

        // schedule next poll
        timeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err: any) {
        console.error("Polling error:", err);
        setLoading(false);
        setError(err?.message || "Polling error");
        // try again a few times
        setAttempts((a) => a + 1);
        if (attempts + 1 < MAX_ATTEMPTS && !cancelledRef.current) {
          timeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    // start polling immediately
    poll();

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, ref, router]); // keep router stable

  // Run a single verification: prefer verify-by-reference if `ref` exists,
  // otherwise check order status.
  const checkOnce = async (): Promise<string> => {
    setError(null);
    setLoading(true);

    // If we have a transaction reference, call the verify endpoint first.
    if (ref) {
      try {
        const resp = await fetch(
          `/api/payments/status/${encodeURIComponent(ref)}`,
        );
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          throw new Error(txt || `Verify endpoint returned ${resp.status}`);
        }
        const json = await resp.json();
        const s = (json.status || "").toString();
        setStatus(s);

        if (s === "paid") {
          // ensure local order (if present) is updated by backend; then proceed
          return "paid";
        }

        // not paid yet
        return s || "pending";
      } catch (err: any) {
        console.warn(
          "Verify by reference failed, falling back to order check:",
          err?.message || err,
        );
        // fall through to order check as fallback
      } finally {
        setLoading(false);
      }
    }

    // Fallback: check order status by orderId
    if (orderId) {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/orders?orderId=${encodeURIComponent(orderId)}`,
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Order endpoint returned ${res.status}`);
        }
        const order = await res.json();
        const s = order?.status ?? null;
        setStatus(s);
        if (s === "paid") {
          return "paid";
        }
        return s || "pending";
      } catch (err: any) {
        throw err;
      } finally {
        setLoading(false);
      }
    }

    // Nothing to check
    setLoading(false);
    setError("No reference or orderId to verify.");
    return "unknown";
  };

  const handleManualRecheck = async () => {
    setError(null);
    setAttempts(0);
    try {
      const result = await checkOnce();
      if (result === "paid") {
        router.push(
          `/results?orderId=${encodeURIComponent(orderId ?? "")}&ref=${encodeURIComponent(ref ?? "")}`,
        );
      }
    } catch (err: any) {
      console.error("Manual re-check failed:", err);
      setError(err?.message || "Manual re-check failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Payment pending</h1>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Reference: <span className="font-mono">{ref ?? "—"}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Order: <span className="font-mono">{orderId ?? "—"}</span>
        </p>
      </div>

      <div className="mb-6">
        <p className="text-lg">
          Status:{" "}
          <strong>{loading ? "checking..." : (status ?? "pending")}</strong>
        </p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <p className="mt-2 text-sm text-muted-foreground">
          We are verifying your payment. This page will update automatically
          once the payment is confirmed.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleManualRecheck}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Re-check now"}
        </button>

        <button
          onClick={() =>
            router.push(
              `/results?orderId=${encodeURIComponent(orderId ?? "")}&ref=${encodeURIComponent(ref ?? "")}`,
            )
          }
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
        >
          Return to results
        </button>

        <div className="ml-auto text-sm text-muted-foreground">
          Attempts: {attempts}/{MAX_ATTEMPTS}
        </div>
      </div>
    </div>
  );
}
