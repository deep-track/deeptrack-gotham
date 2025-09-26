import { NextResponse } from "next/server";
import crypto from "crypto";
import tursoDB from "@/lib/turso-db";
import { ensureDbInitialized } from "@/lib/db-init";
import PostHogClient from "@/lib/posthog-server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  const posthog = PostHogClient();
  
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    if (!PAYSTACK_SECRET) {
      console.warn(
        "PAYSTACK_SECRET_KEY not set; webhook signature won't be verified."
      );
    } else {
      const hmac = crypto.createHmac("sha512", PAYSTACK_SECRET);
      hmac.update(rawBody);
      const expected = hmac.digest("hex");
      if (signature !== expected) {
        console.warn("Paystack webhook signature mismatch");
        return NextResponse.json(
          { ok: false, reason: "invalid_signature" },
          { status: 400 }
        );
      }
    }

    // Ensure database is initialized (only once per server instance)
    await ensureDbInitialized();

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    // Paystack uses events like 'charge.success' or data.status === 'success'
    const reference = data?.reference;
    const metadata = data?.metadata || {};
    const orderId = metadata.orderId || null;
    const paymentType = metadata.type || "order"; // "order" or "token_purchase"

    // Track webhook received
    posthog.capture({
      distinctId: metadata.userEmail || 'anonymous',
      event: 'payment_webhook_received',
      properties: {
        webhook_event: event,
        transaction_reference: reference,
        payment_amount: data?.amount,
        payment_currency: data?.currency,
        webhook_signature_valid: !!PAYSTACK_SECRET,
        payment_type: paymentType,
        order_id: orderId
      }
    });

    if (event === "charge.success" || data?.status === "success") {
      if (paymentType === "token_purchase") {
        // Handle token purchase
        const tokens = metadata.tokens;
        const userEmail = metadata.userEmail;

        if (tokens && userEmail) {
          // Get user and add tokens
          let dbUser = await tursoDB.getUserByEmail(userEmail);
          if (!dbUser) {
            dbUser = await tursoDB.createUser({
              email: userEmail,
              tokens: 0,
            });
          }

          await tursoDB.addTokens(dbUser.id, tokens);
          console.log(
            `${tokens} tokens added to user ${userEmail} via webhook (ref: ${reference})`
          );

          // Track token purchase
          posthog.capture({
            distinctId: userEmail,
            event: 'token_purchase',
            properties: {
              token_amount: tokens,
              price_per_token: 100,
              total_value: tokens * 100,
              currency: 'KES',
              payment_method: 'paystack',
              transaction_id: reference,
              payment_provider: 'paystack',
              webhook_event: 'charge.success'
            }
          });
        } else {
          console.warn(
            "Token purchase webhook missing tokens or userEmail in metadata; reference:",
            reference
          );
        }
      } else if (orderId) {
        // Handle regular order payment
        await tursoDB.setOrderPaymentRef(orderId, reference);
        await tursoDB.updateOrderStatus(orderId, "paid");
        console.log(
          `Order ${orderId} marked paid via webhook (ref: ${reference})`
        );

        // Track purchase
        posthog.capture({
          distinctId: metadata.userEmail || 'anonymous',
          event: 'purchase',
          properties: {
            order_id: orderId,
            transaction_id: reference,
            value: data?.amount || 0,
            currency: data?.currency || 'KES',
            payment_method: 'paystack',
            payment_provider: 'paystack',
            webhook_event: 'charge.success',
            payment_type: 'order'
          }
        });
      } else {
        // optionally handle the case where metadata was not provided
        console.warn(
          "Webhook paid but no orderId in metadata; reference:",
          reference
        );
      }
    } else {
      console.log("Unhandled Paystack event:", event, data?.status);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("/api/webhooks/paystack error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    await posthog.shutdown();
  }
}
