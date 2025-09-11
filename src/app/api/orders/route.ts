import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mockDb from "@/lib/mock-db";

export async function POST(req: Request) {
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

    const order = mockDb.createOrder({ 
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
  try {
    const { userId } = await auth();
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (orderId) {
      // Get a single order
      const order = mockDb.getOrder(orderId);
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
      
      return NextResponse.json(order);
    } else {
      // Get orders - require authentication for listing
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const allOrders = mockDb.listOrders();
      const userOrders = allOrders.filter(order => order.userId === userId);
      return NextResponse.json(userOrders);
    }
  } catch (err: any) {
    console.error("/api/orders GET error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
