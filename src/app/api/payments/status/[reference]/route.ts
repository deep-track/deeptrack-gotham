import { NextResponse } from "next/server";
import mockDb from "@/lib/mock-db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * GET /api/payments/status/:reference
 * - If we already have an order marked paid, return that.
 * - Otherwise call Paystack /transaction/verify/:reference to get authoritative state.
 * - If Paystack returns success, update the order (if found via metadata) and return status.
 */
export async function GET(
  req: Request,
  { params }: { params: { reference?: string } },
) {
  try {
    const reference = params?.reference;
    if (!reference) {
      return NextResponse.json(
        { error: "reference param required" },
        { status: 400 },
      );
    }

    // 1) Try to find an existing order by stored paymentRef
    const orders = mockDb.listOrders ? mockDb.listOrders() : [];
    let order = orders.find((o: any) => o.paymentRef === reference);

    if (order && order.status === "paid") {
      return NextResponse.json({ status: "paid", orderId: order.id });
    }

    // 2) If we don't have Paystack secret, we can't verify with Paystack
    if (!PAYSTACK_SECRET) {
      // Return whatever we know (pending/unknown)
      const knownStatus = order ? order.status : "unknown";
      return NextResponse.json({
        status: knownStatus,
        orderId: order?.id ?? null,
      });
    }

    // 3) Call Paystack verify endpoint
    const resp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      },
    );

    const json = await resp.json().catch(() => null);

    if (!resp.ok || !json) {
      // Could not verify with Paystack
      return NextResponse.json(
        {
          status: "unknown",
          error: json?.message || "Paystack verification failed",
        },
        { status: 502 },
      );
    }

    // Paystack returns { status: true, message, data: { status: 'success'|'failed'|... , metadata: {...} } }
    const psData = json.data;
    const psStatus = (psData?.status || "").toLowerCase();

    // Map Paystack status to simple internal statuses
    const mapped =
      psStatus === "success"
        ? "paid"
        : psStatus === "failed" || psStatus === "abandoned"
          ? "failed"
          : "pending";

    // If Paystack returned metadata.orderId, use it to update our order
    const metadataOrderId = psData?.metadata?.orderId;

    if (mapped === "paid") {
      if (metadataOrderId) {
        const found = mockDb.getOrder(metadataOrderId);
        if (found) {
          mockDb.setOrderPaymentRef(found.id, reference);
          mockDb.updateOrderStatus(found.id, "paid");
          return NextResponse.json({ status: "paid", orderId: found.id });
        }
      }

      // If we didn't have metadataOrderId, try to find an order by existing reference (again)
      if (order) {
        mockDb.setOrderPaymentRef(order.id, reference);
        mockDb.updateOrderStatus(order.id, "paid");
        return NextResponse.json({ status: "paid", orderId: order.id });
      }

      // No order found to update — still return paid so client can proceed
      return NextResponse.json({
        status: "paid",
        orderId: metadataOrderId ?? null,
      });
    }

    // Not paid
    // Optionally update local order status if we have one
    if (order && mapped !== order.status) {
      // keep local in sync for future polling
      mockDb.updateOrderStatus(
        order.id,
        mapped === "failed" ? "failed" : "payment_pending",
      );
    }

    return NextResponse.json({
      status: mapped,
      orderId: order?.id ?? metadataOrderId ?? null,
      raw: psData,
    });
  } catch (err: any) {
    console.error("/api/payments/status error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
