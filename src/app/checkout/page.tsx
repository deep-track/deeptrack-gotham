"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store";

/**
 * Checkout page
 *
 * - Expects query param `orderId`
 * - Loads order via GET /api/orders?orderId=...
 * - Collects email (prefilled from Clerk if available)
 * - Calls POST /api/create-paystack { orderId, email } to initialize payment
 * - Redirects browser to returned authorization_url
 *
 * Notes:
 * - This is intentionally lightweight: errors are surfaced inline.
 * - Replace alert() with a toast system if you prefer (Toaster is available).
 */

export default function CheckoutPage() {
  const search = useSearchParams();
  const router = useRouter();
  const orderId = search?.get("orderId") ?? "";
  const { isLoaded, isSignedIn, user } = useUser();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const files = useDashboardStore((s) => s.files);

  useEffect(() => {
    // Prefill email from Clerk if available
    if (isLoaded && isSignedIn && user) {
      // Clerk's user shape can vary; try common fields
      const primary = (user as any).primaryEmailAddress?.emailAddress;
      const alt =
        (user as any).emailAddresses &&
        (user as any).emailAddresses[0]?.emailAddress;
      setEmail(primary || alt || (user as any).email || "");
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!orderId) {
      setError("No orderId specified.");
      setFetching(false);
      return;
    }

    let cancelled = false;
    setFetching(true);
    fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Failed to load order (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
      })
      .catch((err: any) => {
        console.error("Failed to fetch order:", err);
        if (!cancelled) setError(err?.message || "Failed to load order");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handlePay = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!orderId) {
      setError("Missing orderId.");
      return;
    }
    if (!email) {
      setError("Please provide an email address.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/create-paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Payment init failed (${resp.status})`);
      }

      const json = await resp.json();
      const url = json.authorization_url || json.authorizationUrl || json.url;
      const reference = json.reference || json.ref;

      if (!url) {
        throw new Error(
          "Payment provider did not return an authorization URL.",
        );
      }

      // Optionally persist reference locally or in store if needed
      // Redirect to Paystack hosted payment page
      window.location.href = url;
    } catch (err: any) {
      console.error("create-paystack error:", err);
      setError(err?.message || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete your payment to start processing. You will be returned to the
          site when payment is complete.
        </p>
      </header>

      {!orderId ? (
        <Card className="p-6">
          <p className="text-sm text-red-500">
            No order specified. Go back and try again.
          </p>
          <div className="mt-4">
            <Button onClick={() => router.push("/")} className="mr-2">
              Return home
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              {fetching ? (
                <p>Loading order…</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : order ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Order ID: <span className="font-mono">{order.id}</span>
                    </p>
                    <p>
                      Status: <strong>{order.status}</strong>
                    </p>
                    <p>
                      Total:{" "}
                      <strong>
                        {(order.totalAmountCents / 100).toFixed(2)}{" "}
                        {order.currency}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Uploads</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {(order.uploadIds || []).map((id: string) => (
                        <li key={id} className="truncate">
                          {id}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>No order data.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePay} className="space-y-4">
                <label className="block">
                  <span className="text-sm">Email address</span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "mt-1 block w-full rounded border px-3 py-2",
                      "focus:ring-2 focus:ring-primary/40",
                    )}
                  />
                </label>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={loading || fetching}>
                    {loading
                      ? "Redirecting…"
                      : `Pay ${(order?.totalAmountCents ?? 0) / 100} ${order?.currency ?? ""}`}
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Cancel
                  </Button>
                </div>

                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
