import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import tursoDB from "@/lib/turso-db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    // Server-side authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (
      !body ||
      !body.tokens ||
      typeof body.tokens !== "number" ||
      body.tokens <= 0
    ) {
      return NextResponse.json(
        { error: "Valid tokens amount is required (positive number)" },
        { status: 400 }
      );
    }

    const { tokens } = body;

    // Calculate amount in cents (1 token = 100 cents = $1.00)
    const amountCents = tursoDB.tokensToAmount(tokens);

    // Check if this is a demo user - demo users can't purchase tokens
    if (tursoDB.isDemoUser(userEmail)) {
      return NextResponse.json(
        {
          error: "Demo users cannot purchase additional tokens",
        },
        { status: 400 }
      );
    }

    // Ensure database tables are initialized
    await tursoDB.initTables();

    // Get or create user in our database
    let dbUser = await tursoDB.getUserByEmail(userEmail);
    if (!dbUser) {
      dbUser = await tursoDB.createUser({
        email: userEmail,
        tokens: 0,
      });
    }

    if (!PAYSTACK_SECRET) {
      console.warn(
        "PAYSTACK_SECRET_KEY is not set. purchase-tokens will fail in runtime."
      );
      return NextResponse.json(
        { error: "Server not configured: PAYSTACK_SECRET_KEY missing" },
        { status: 500 }
      );
    }

    // Create a unique transaction reference for token purchase
    const txRef = `TOKEN-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    // Build callback URL
    const origin = req.headers.get("origin") || PUBLIC_ORIGIN;
    const callbackUrl = `${origin}/payment-pending?type=tokens&tokens=${tokens}&ref=${encodeURIComponent(
      txRef
    )}`;

    // Initialize Paystack transaction
    const paystackPayload = {
      email: userEmail,
      amount: amountCents, // Amount in kobo (cents)
      reference: txRef,
      callback_url: callbackUrl,
      metadata: {
        type: "token_purchase",
        tokens: tokens,
        userId: userId,
        userEmail: userEmail,
      },
    };

    const initResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("Paystack initialization failed:", errorText);
      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 500 }
      );
    }

    const initJson = await initResponse.json();
    if (!initJson.status || !initJson.data?.authorization_url) {
      console.error("Paystack response missing authorization_url:", initJson);
      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: initJson.data.authorization_url,
      reference: txRef,
      tokens: tokens,
      amountCents: amountCents,
    });
  } catch (err: unknown) {
    console.error("/api/purchase-tokens error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// GET endpoint to check user's current token balance
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Ensure database tables are initialized
    await tursoDB.initTables();

    // Get user from our database
    let dbUser = await tursoDB.getUserByEmail(userEmail);
    if (!dbUser) {
      // Create user if doesn't exist
      const initialTokens = tursoDB.isDemoUser(userEmail) ? 300 : 0;
      dbUser = await tursoDB.createUser({
        email: userEmail,
        tokens: initialTokens,
      });
    }

    return NextResponse.json({
      tokens: dbUser.tokens,
      email: userEmail,
      isDemoUser: tursoDB.isDemoUser(userEmail),
    });
  } catch (err: unknown) {
    console.error("/api/purchase-tokens GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
