import { NextResponse } from "next/server";
import mockDb from "@/lib/mock-db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const media = formData.get("media") as File | null;

    if (!media) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = (media as any).name || "upload";
    const size = (media as any).size ?? (await media.arrayBuffer()).byteLength;
    const mime = (media as any).type || "application/octet-stream";

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
