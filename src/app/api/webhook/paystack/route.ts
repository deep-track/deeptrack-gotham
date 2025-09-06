import { NextResponse } from "next/server";
import crypto from "crypto";
import mockDb from "@/lib/mock-db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    if (!PAYSTACK_SECRET) {
      console.warn(
        "PAYSTACK_SECRET_KEY not set; webhook signature won't be verified.",
      );
    } else {
      const hmac = crypto.createHmac("sha512", PAYSTACK_SECRET);
      hmac.update(rawBody);
      const expected = hmac.digest("hex");
      if (signature !== expected) {
        console.warn("Paystack webhook signature mismatch");
        return NextResponse.json(
          { ok: false, reason: "invalid_signature" },
          { status: 400 },
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    // Paystack uses events like 'charge.success' or data.status === 'success'
    const reference = data?.reference;
    const metadata = data?.metadata || {};
    const orderId = metadata.orderId || null;

    if (event === "charge.success" || data?.status === "success") {
      if (orderId) {
        // mark order paid and store provider reference
        mockDb.setOrderPaymentRef(orderId, reference);
        mockDb.updateOrderStatus(orderId, "paid");
        console.log(
          `Order ${orderId} marked paid via webhook (ref: ${reference})`,
        );
      } else {
        // optionally handle the case where metadata was not provided
        console.warn(
          "Webhook paid but no orderId in metadata; reference:",
          reference,
        );
      }
    } else {
      console.log("Unhandled Paystack event:", event, data?.status);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("/api/webhooks/paystack error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
