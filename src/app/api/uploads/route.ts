import { NextResponse } from "next/server";
import tursoDB from "@/lib/turso-db";

export async function POST(req: Request) {
  // Ensure database tables are initialized
  try {
    await tursoDB.initTables();
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
    return NextResponse.json(
      { error: "Database initialization failed" },
      { status: 500 }
    );
  }
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
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",

      // Audio
      "audio/mpeg", 
      "audio/wav",

      // Video
      "video/mp4",
      "video/webm",
      "video/quicktime", 
      "video/x-msvideo",
      "video/x-ms-wmv",  
      "video/x-matroska", 
      "video/x-flv"
    ];
    
    if (!allowedTypes.includes(media.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    const filename = media.name || "upload";
    const size = media.size;
    // Create upload record in database
    const upload = await tursoDB.createUpload({
      filename: media.name,
      size: media.size,
      mime: media.type,
      metadata: {
        originalName: media.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Persist base64 data so background processing can read it
    try {
      const arrayBuffer = await media.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${media.type};base64,${base64}`;
      await tursoDB.setUploadData(upload.id, dataUrl);
    } catch (e) {
      console.warn("Failed to persist base64 for upload", upload.id, e);
    }

    return NextResponse.json({
      uploadId: upload.id,
      filename: upload.filename,
      size: upload.size,
      mime: upload.mime,
    });
  } catch (err: any) {
    console.error("/api/uploads error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
