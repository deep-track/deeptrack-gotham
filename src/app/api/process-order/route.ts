import { NextResponse } from "next/server";
import { RealityDefender } from "@realitydefender/realitydefender";
import mockDb from "@/lib/mock-db";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const rd = new RealityDefender({
  apiKey: process.env.REALITY_DEFENDER_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    // Get the order
    const order = mockDb.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get uploads for this order
    const uploads = order.uploadIds?.map(id => mockDb.getUpload(id)).filter(Boolean) || [];
    
    if (uploads.length === 0) {
      return NextResponse.json({ error: "No uploads found for order" }, { status: 400 });
    }

    // Process the first upload (for now, could extend to handle multiple)
    const upload = uploads[0];
    if (!upload) {
      return NextResponse.json({ error: "Upload record not found" }, { status: 404 });
    }

    // For now, we'll use the check-media API approach since uploads don't store file paths
    // In a real implementation, you'd store file paths or S3 keys in uploads
    console.log(`Processing verification for order ${orderId}, upload: ${upload.filename}`);

    // Since we don't have the actual file path stored, we'll create a mock verification result
    // In production, you'd either:
    // 1. Store file paths in upload records
    // 2. Use S3 keys to download files
    // 3. Process files immediately on upload
    
    const mockRdResult = {
      requestId: `rd_${Date.now()}`,
      status: "AUTHENTIC",
      score: 0.85 + Math.random() * 0.1, // Random score between 0.85-0.95
      models: [
        { name: 'rd-context-img', status: 'AUTHENTIC', score: 0.88 + Math.random() * 0.1 },
        { name: 'rd-pine-img', status: 'AUTHENTIC', score: 0.82 + Math.random() * 0.1 }
      ]
    };

    console.log("Mock Reality Defender response:", JSON.stringify(mockRdResult, null, 2));

    // Create a simple base64 image for display
    const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

    // Build verification result
    const verificationResult = {
      imageBase64: mockImageBase64,
      fileMeta: {
        name: upload.filename,
        type: upload.mime,
        size: upload.size,
      },
      analysis: {
        requestId: mockRdResult?.requestId ?? "N/A",
        status: mockRdResult?.status ?? "UNKNOWN",
        score: typeof mockRdResult?.score === "number" ? mockRdResult.score : null,
        models: Array.isArray(mockRdResult?.models) ? mockRdResult.models : [],
        raw: mockRdResult,
      },
    };

    // Store result in order
    mockDb.setOrderResult(orderId, verificationResult);
    mockDb.updateOrderStatus(orderId, "completed");

    return NextResponse.json({ 
      success: true, 
      orderId,
      result: verificationResult 
    });

  } catch (error: any) {
    console.error("Error processing order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
