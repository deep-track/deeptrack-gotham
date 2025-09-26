"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";

export default function Login() {
  // Check if we're in build mode
  const isBuildMode = process.env.NODE_ENV === 'production' && 
    (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key'));

  if (isBuildMode) {
    return (
      <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login</h1>
          <p className="text-gray-600">This page is not available during build.</p>
        </div>
      </div>
    );
  }

  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const posthog = usePostHog();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return; // wait until Clerk has loaded

    if (isSignedIn) {
      // redirect away if already logged in
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);


  // Email & Password Login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErr("Please enter both email and password.");
      return;
    }
    if (!isLoaded || !signIn) return;

    setErr(null);
    setLoading(true);

    // Track login attempt
    posthog.capture('user_signed_in', {
      signin_method: 'email',
      user_type: 'returning_user',
      email_domain: email.split('@')[1],
      page_type: 'login'
    });

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        setErr("Something went wrong. Please try again.");
        
        // Track login failure
        posthog.capture('auth_failed', {
          auth_method: 'email_password',
          error_message: 'Incomplete signin',
          page_type: 'login'
        });
      }
    } catch (e: unknown) {
      const error = e as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
      const message =
        error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error.message || "Login failed";
      setErr(message);
      
      // Track login failure
      posthog.capture('auth_failed', {
        auth_method: 'email_password',
        error_message: message,
        page_type: 'login'
      });
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth
  async function loginWithGoogle() {
    if (!isLoaded || !signIn) return;
    
    // Track Google login attempt
    posthog.capture('user_signed_in', {
      signin_method: 'google',
      user_type: 'returning_user',
      email_domain: 'google',
      page_type: 'login'
    });
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (e: unknown) {
      const error = e as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
      const message =
        error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error.message || "Google sign-in failed";
      setErr(message);
      
      // Track Google login failure
      posthog.capture('auth_failed', {
        auth_method: 'google_oauth',
        error_message: message,
        page_type: 'login'
      });
    }
  }

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center px-4">
      <div className="flex flex-col md:flex-row-reverse w-full max-w-5xl rounded-2xl overflow-hidden border border-border shadow-lg bg-card/70">

        {/* Left image */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <Image src="/deeptrack-security.svg" alt="Login Illustration" width={400} height={400} />
        </div>

        {/* Right form area */}
        <div className="w-full md:w-1/2 px-6 py-10 space-y-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
            Welcome Back
          </h2>

          {err && <p className="text-sm text-red-500">{err}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-1 text-foreground/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-foreground/80">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70 text-stone-100 font-medium py-2 rounded-md shadow-sm hover:opacity-90 transition"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="text-center">
              <Link
                href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="text-sm text-blue-500 hover:text-blue-600 underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={loginWithGoogle}
            className="flex items-center justify-center gap-2 w-full bg-white/5 text-white py-2 rounded-md hover:bg-gray-100 hover:text-muted-foreground transition border border-border"
          >
            <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
            Continue with Google
          </button>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
