import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import tursoDB from "@/lib/turso-db";
import { ensureDbInitialized } from "@/lib/db-init";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    // Ensure database is initialized (only once per server instance)
    await ensureDbInitialized();

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
    if (!body || !body.orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const { orderId } = body;
    // Use verified email from Clerk instead of client-provided email
    const email = userEmail;
    console.log(await tursoDB.listUploads());
    console.log(await tursoDB.listOrders());
    const order = await tursoDB.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization check: ensure user owns this order
    if (order.userId && order.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If order doesn't have a userId yet, assign it to current user
    if (!order.userId) {
      await tursoDB.updateOrderUser(orderId, userId);
    }

    // Check if this is a demo user - if so, bypass payment and auto-complete
    if (tursoDB.isDemoUser(userEmail)) {
      // Create a demo transaction reference
      const txRef = `DEMO-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      // Mark order as paid and completed for demo user
      await tursoDB.setOrderPaymentRef(orderId, txRef);
      await tursoDB.updateOrderStatus(orderId, "paid");

      // Build result URL for demo user (skip payment page)
      const origin = req.headers.get("origin") || PUBLIC_ORIGIN;
      const resultUrl = `${origin}/results?orderId=${encodeURIComponent(
        orderId
      )}&ref=${encodeURIComponent(txRef)}`;

      return NextResponse.json({
        message: "Demo user - payment bypassed",
        redirect_url: resultUrl,
        orderId: orderId,
        reference: txRef,
        isDemoUser: true,
      });
    }

    if (!PAYSTACK_SECRET) {
      console.warn(
        "PAYSTACK_SECRET_KEY is not set. create-paystack will fail in runtime."
      );
      return NextResponse.json(
        { error: "Server not configured: PAYSTACK_SECRET_KEY missing" },
        { status: 500 }
      );
    }

    // Create a unique transaction reference
    const txRef = `DT-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Persist reference and mark order payment_pending
    await tursoDB.setOrderPaymentRef(orderId, txRef);
    await tursoDB.updateOrderStatus(orderId, "payment_pending");

    // Build callback URL (include orderId and reference)
    const origin = req.headers.get("origin") || PUBLIC_ORIGIN;
    const callbackUrl = `${origin}/payment-pending?orderId=${encodeURIComponent(
      orderId
    )}&ref=${encodeURIComponent(txRef)}`;

    // Initialize Paystack transaction
    const initResp = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: order.totalAmountCents * 100, // amount in smallest currency unit
          reference: txRef,
          callback_url: callbackUrl,
          metadata: {
            orderId,
          },
        }),
      }
    );

    const initJson = await initResp.json().catch(() => null);

    if (!initResp.ok || !initJson?.data?.authorization_url) {
      console.error("Paystack initialize failed:", initResp.status, initJson);
      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorization_url: initJson.data.authorization_url,
      reference: txRef,
    });
  } catch (err: unknown) {
    console.error("/api/create-paystack error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
