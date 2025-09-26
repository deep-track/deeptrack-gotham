"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  // Check if we're in build mode
  const isBuildMode = process.env.NODE_ENV === 'production' && 
    (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key'));

  if (isBuildMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">SSO Callback</h1>
          <p className="text-gray-600">This page is not available during build.</p>
        </div>
      </div>
    );
  }

  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback({});
        // Redirect back to checkout or wherever the user came from
        const returnUrl = sessionStorage.getItem('clerk_return_url') || '/checkout';
        router.push(returnUrl);
      } catch (error) {
        console.error('SSO callback error:', error);
        router.push('/checkout?error=auth_failed');
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
