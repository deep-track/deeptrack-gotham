// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  if (!(await auth()).userId) {
    console.log("not logged in");
    // redirect to Clerk sign-in page
    // return redirectToSignIn({ returnBackUrl: req.url });

    // or if you want a custom redirect to home:
    // return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    // protect everything except Next.js internals & static files
    "/((?!_next|.*\\..*).*)",
    "/api/(.*)",
  ],
};
