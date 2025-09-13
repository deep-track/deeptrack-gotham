"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
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
