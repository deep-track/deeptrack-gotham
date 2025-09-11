// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  '/api/create-paystack(.*)',
  '/payment-pending(.*)',
  '/results(.*)'
]);

const isOrderProtectedRoute = createRouteMatcher([
  '/api/orders(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Protect routes that always require authentication
  if (isProtectedRoute(req)) {
    if (!userId) {
      // For API routes, return 401
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // For pages, redirect to sign-in
      const signInUrl = new URL('/login', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Special handling for order API - allow GET for anonymous, require auth for others
  if (isOrderProtectedRoute(req)) {
    if (req.method !== 'GET' && req.method !== 'POST') {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }
});

export const config = {
  matcher: [
    // protect everything except Next.js internals & static files
    "/((?!_next|.*\\..*).*)",
    "/api/(.*)",
  ],
};
