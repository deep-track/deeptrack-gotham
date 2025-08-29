import { NextResponse } from "next/server";
import { RealityDefender } from "@realitydefender/realitydefender";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const rd = new RealityDefender({
  apiKey: process.env.REALITY_DEFENDER_API_KEY as string,
});

export async function POST(req: Request) {
  console.log("POST /api/check-media called");

  try {
    const formData = await req.formData();
    const file = formData.get("media") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save file temporarily
    const tempPath = path.join(os.tmpdir(), file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    console.log(`Temp file saved at: ${tempPath}`);

    // Call Reality Defender
    const rdResult = await rd.detect({ filePath: tempPath });
    console.log("Reality Defender full response:", JSON.stringify(rdResult, null, 2));

    // Cleanup temp file
    fs.unlinkSync(tempPath);

    // Build normalized response
    const responsePayload = {
      imageBase64: `data:${file.type};base64,${buffer.toString("base64")}`,
      fileMeta: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      result: {
        requestId: rdResult?.requestId ?? "N/A",
        status: rdResult?.status ?? "UNKNOWN",
        score: typeof rdResult?.score === "number" ? rdResult.score : null,
        models: Array.isArray(rdResult?.models) ? rdResult.models : [],
        raw: rdResult,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("Error in check-media:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
