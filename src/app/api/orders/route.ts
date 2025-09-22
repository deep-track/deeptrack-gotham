import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import tursoDB from "@/lib/turso-db";
import { ensureDbInitialized } from "@/lib/db-init";

export async function POST(req: Request) {
  // Ensure database is initialized (only once per server instance)
  await ensureDbInitialized();
  try {
    // Authentication not required for creating orders (anonymous uploads allowed)
    // But we'll capture userId if available for later association
    const { userId } = await auth();
    
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.uploads)) {
      return NextResponse.json(
        { error: "Invalid body, expected { uploads: string[] }" },
        { status: 400 }
      );
    }

    const order = await tursoDB.createOrder({ 
      uploadIds: body.uploads,
      userId: userId || null
    });
    return NextResponse.json({
      orderId: order.id,
      totalAmountCents: order.totalAmountCents,
      currency: order.currency,
      status: order.status,
    });
  } catch (err: any) {
    console.error("/api/orders POST error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Ensure database is initialized (only once per server instance)
  await ensureDbInitialized();
  try {
    const { userId } = await auth();
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (orderId) {
      // Get a single order
      const order = await tursoDB.getOrder(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      
      // If user is authenticated, check ownership
      if (userId) {
        if (order.userId && order.userId !== userId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      // If not authenticated, allow access to orders without userId (anonymous orders)
      else {
        if (order.userId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      
      {
        const res = NextResponse.json(order);
        res.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
        return res;
      }
    } else {
      // Get orders - require authentication for listing
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(req.url);
      const includeResult = url.searchParams.get("includeResult") === "1";
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam))) : undefined;

      const allOrders = await tursoDB.listOrders();
      let userOrders = allOrders.filter((order: any) => order.userId === userId);
      // Newest first
      userOrders.sort((a: any, b: any) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      if (limit) userOrders = userOrders.slice(0, limit);

      if (!includeResult) {
        // Return lightweight summaries to avoid sending large base64 payloads
        const summaries = userOrders.map((o: any) => ({
          id: o.id,
          uploadIds: o.uploadIds,
          userId: o.userId,
          totalAmountCents: o.totalAmountCents,
          currency: o.currency,
          status: o.status,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          paymentRef: o.paymentRef,
          notes: o.notes,
          hasResult: !!o.result,
        }));
        {
          const res = NextResponse.json(summaries);
          res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=60');
          return res;
        }
      }

      {
        const res = NextResponse.json(userOrders);
        res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=60');
        return res;
      }
    }
  } catch (err: any) {
    console.error("/api/orders GET error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
