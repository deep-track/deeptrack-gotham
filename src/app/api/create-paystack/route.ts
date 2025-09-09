import { NextResponse } from "next/server";
import mockDb from "@/lib/mock-db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    if (!PAYSTACK_SECRET) {
      console.warn(
        "PAYSTACK_SECRET_KEY is not set. create-paystack will fail in runtime."
      );
      return NextResponse.json(
        { error: "Server not configured: PAYSTACK_SECRET_KEY missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.orderId || !body.email) {
      return NextResponse.json(
        { error: "orderId and email are required" },
        { status: 400 }
      );
    }

    const { orderId, email } = body;
    console.log(mockDb.listUploads());
    console.log(mockDb.listOrders());
    const order = mockDb.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create a unique transaction reference
    const txRef = `DT-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Persist reference and mark order payment_pending
    mockDb.setOrderPaymentRef(orderId, txRef);
    mockDb.updateOrderStatus(orderId, "payment_pending");

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
  } catch (err: any) {
    console.error("/api/create-paystack error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
