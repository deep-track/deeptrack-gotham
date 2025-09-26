"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useUser, useSignIn, useSignUp } from "@clerk/nextjs";
import { useDashboardStore } from "@/lib/store";
import posthog from "posthog-js";
import Image from "next/image";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading checkout...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  // Check if we're in build mode
  const isBuildMode = process.env.NODE_ENV === 'production' && 
    (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key'));

  if (isBuildMode) {
    return (
      <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Checkout</h1>
          <p className="text-gray-600">This page is not available during build.</p>
        </div>
      </div>
    );
  }

  const search = useSearchParams();
  const router = useRouter();
  const orderId = search?.get("orderId") ?? "";
  const { isSignedIn, user } = useUser();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  // PostHog is now available globally via instrumentation-client.ts

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Get uploaded files from store for display
  const { files } = useDashboardStore();

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;
    
    setAuthLoading(true);
    setError(null);

    // Track authentication attempt
    posthog.capture('payment_info_entered', {
      cart_id: orderId,
      user_type: authMode === 'signin' ? 'returning_user' : 'new_user',
      auth_method: 'email_password',
      email_domain: email.split('@')[1]
    });

    try {
      if (authMode === 'signin') {
        if (!signIn) return;
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          
          // Track successful sign in
          posthog.capture('user_signed_in', {
            signin_method: 'email',
            user_type: 'returning_user',
            page_type: 'checkout'
          });
        }
      } else {
        if (!signUp) return;
        await signUp.create({
          emailAddress: email,
          password,
        });
        
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        // For demo purposes, we'll auto-complete. In production, handle email verification
        const completeSignUp = await signUp.attemptEmailAddressVerification({ code: "123456" });
        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId });
          
          // Track successful sign up
          posthog.capture('user_signed_up', {
            signup_method: 'email',
            user_type: 'business_user',
            email_domain: email.split('@')[1],
            page_type: 'checkout'
          });
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || 'Authentication failed');
      
      // Track authentication failure
      posthog.capture('auth_failed', {
        auth_method: 'email_password',
        error_message: err?.errors?.[0]?.longMessage || err?.message,
        page_type: 'checkout'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!signIn) return;
    
    // Track Google auth attempt
    posthog.capture('payment_info_entered', {
      cart_id: orderId,
      user_type: 'returning_user',
      auth_method: 'google_oauth',
      email_domain: 'google'
    });
    
    try {
      // Store current URL with orderId for after OAuth redirect
      sessionStorage.setItem('clerk_return_url', window.location.href);
      
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: window.location.origin + "/sso-callback",
        redirectUrlComplete: window.location.href,
      });
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
      
      // Track Google auth failure
      posthog.capture('auth_failed', {
        auth_method: 'google_oauth',
        error_message: err?.message,
        page_type: 'checkout'
      });
    }
  };

  const handlePay = async () => {
    setError(null);
    if (!orderId) {
      setError("Missing orderId.");
      return;
    }
    if (!isSignedIn) {
      setError("Please sign in to continue with payment.");
      return;
    }

    // Track checkout started
    posthog.capture('checkout_started', {
      cart_id: orderId,
      user_type: 'business_user',
      payment_method: 'paystack',
      page_type: 'checkout',
      order_value: order?.total || 0,
      currency: 'KES'
    });

    setLoading(true);
    try {
      const resp = await fetch("/api/create-paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Payment init failed (${resp.status})`);
      }

      const json = await resp.json();
      const url = json.authorization_url || json.authorizationUrl || json.url;

      if (!url) {
        throw new Error(
          "Payment provider did not return an authorization URL.",
        );
      }

      // Track payment method selected
      posthog.capture('payment_method_selected', {
        cart_id: orderId,
        payment_method: 'paystack',
        payment_provider: 'paystack',
        order_value: order?.total || 0,
        currency: 'KES'
      });

      window.location.href = url;
    } catch (err: any) {
      console.error("create-paystack error:", err);
      setError(err?.message || "Failed to initialize payment");
      
      // Track payment failure
      posthog.capture('payment_failed', {
        cart_id: orderId,
        error_message: err?.message,
        payment_method: 'paystack',
        order_value: order?.total || 0,
        currency: 'KES'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <Toaster />
      {/* Background color split screen for large screens */}
      <div aria-hidden="true" className="fixed top-0 left-0 hidden h-full w-1/2 bg-white lg:block" />
      <div aria-hidden="true" className="fixed top-0 right-0 hidden h-full w-1/2 bg-black lg:block" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 lg:pt-16">
        <h1 className="sr-only">Checkout</h1>

        {/* Order Summary Section */}
        <section
          aria-labelledby="summary-heading"
          className="bg-black py-12 text-white/80 md:px-10 lg:col-start-2 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-24"
        >
          <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
            <h2 id="summary-heading" className="sr-only">Order summary</h2>

            {fetching ? (
              <div className="text-white">Loading order...</div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : order ? (
              <>
                <dl>
                  <dt className="text-sm font-medium">Amount due</dt>
                  <dd className="mt-1 text-3xl font-bold tracking-tight text-white">
                    ${(order.totalAmountCents / 100).toFixed(2)}
                  </dd>
                </dl>

                <ul role="list" className="divide-y divide-white/10 text-sm font-medium mt-6">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-start space-x-4 py-6">
                      <div className="size-20 flex-none rounded-md bg-gray-800 flex items-center justify-center border border-gray-700">
                        <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-auto space-y-1">
                        <h3 className="text-white">{file.name}</h3>
                        <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Image verification</p>
                      </div>
                      <p className="flex-none text-base font-medium text-white">$1.00</p>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-6 border-t border-white/10 pt-6 text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <dt>Subtotal</dt>
                    <dd>${(order.totalAmountCents / 100).toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-6 text-white">
                    <dt className="text-base">Total</dt>
                    <dd className="text-base">${(order.totalAmountCents / 100).toFixed(2)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="text-white">No order data</div>
            )}
          </div>
        </section>

        {/* Authentication/Payment Section */}
        <section
          aria-labelledby="payment-and-auth-heading"
          className="py-16 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:pt-0 lg:pb-24"
        >
          <h2 id="payment-and-auth-heading" className="sr-only">
            Authentication and payment
          </h2>

          <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
            {!isSignedIn ? (
              /* Sign In/Sign Up Form */
              <div>
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                      authMode === 'signin'
                        ? 'bg-black text-white border border-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                      authMode === 'signup'
                        ? 'bg-black text-white border border-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                  {authMode === 'signup' && (
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-2">
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-2">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-2 focus:outline-black disabled:opacity-50"
                  >
                    {authLoading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleAuth}
                    className="mt-4 w-full flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
                    Continue with Google
                  </button>
                </div>
              </div>
            ) : (
              /* Payment Section - Only shown when authenticated */
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to pay</h3>
                  <p className="text-sm text-gray-600">
                    Signed in as {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handlePay}
                    disabled={loading || fetching}
                    className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium transition-all"
                  >
                    {loading
                      ? "Processing..."
                      : `Pay $${(order?.totalAmountCents ?? 0) / 100}`}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/")} 
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
