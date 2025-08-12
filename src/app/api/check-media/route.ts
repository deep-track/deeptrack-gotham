import { NextResponse } from 'next/server';
import { RealityDefender } from '@realitydefender/realitydefender';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

const rd = new RealityDefender({
  apiKey: process.env.REALITY_DEFENDER_API_KEY as string,
});

export async function POST(req: Request) {
  console.log('POST /api/check-media called');

  try {
    const formData = await req.formData();
    const file = formData.get('media') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save file temporarily
    const tempPath = path.join(os.tmpdir(), file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    console.log(`Temp file saved at: ${tempPath}`);

    // Call Reality Defender
    const rdResult = await rd.detect({ filePath: tempPath });
    console.log('Reality Defender Result:', rdResult);

    // Cleanup temp file
    fs.unlinkSync(tempPath);

    // Build response with full breakdown
    const responsePayload = {
      imageBase64: `data:${file.type};base64,${buffer.toString('base64')}`,
      fileMeta: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      result: {
        status: rdResult?.status ?? 'UNKNOWN',
        score: rdResult?.score ?? null,
        models: rdResult?.models ?? [],
        raw: rdResult
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Error in check-media:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
