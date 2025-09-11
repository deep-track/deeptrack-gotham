import { NextResponse } from "next/server";
import mockDb from "@/lib/mock-db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const media = formData.get("media") as File | null;

    if (!media) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file is actually a File object
    if (!(media instanceof File)) {
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
    }

    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (media.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // File type validation (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(media.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    const filename = media.name || "upload";
    const size = media.size;
    const mime = media.type;

    const rec = mockDb.createUpload({ filename, size, mime });

    return NextResponse.json({
      uploadId: rec.id,
      filename: rec.filename,
      size: rec.size,
      mime: rec.mime,
    });
  } catch (err: any) {
    console.error("/api/uploads error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
