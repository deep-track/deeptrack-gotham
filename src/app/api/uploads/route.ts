import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

  // Get authenticated user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Get user email from Clerk
  const clerkUser = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  });

  if (!clerkUser.ok) {
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }

  const userData = await clerkUser.json();
  const userEmail = userData.email_addresses?.[0]?.email_address;

  if (!userEmail) {
    return NextResponse.json(
      { error: "User email not found" },
      { status: 500 }
    );
  }

  try {
    // Get or create user in our database
    let dbUser = await tursoDB.getUserByEmail(userEmail);
    if (!dbUser) {
      // Create user - demo users get 300 tokens, others get 0
      const initialTokens = tursoDB.isDemoUser(userEmail) ? 300 : 0;
      dbUser = await tursoDB.createUser({
        email: userEmail,
        tokens: initialTokens,
      });
    }

    // Check if user has sufficient tokens (unless demo user)
    if (!tursoDB.isDemoUser(userEmail)) {
      if (dbUser.tokens < 1) {
        return NextResponse.json(
          {
            error: "Insufficient tokens. Please purchase tokens to continue.",
            tokensRequired: 1,
            currentTokens: dbUser.tokens,
          },
          { status: 402 }
        ); // Payment Required
      }
    }

    const formData = await req.formData();
    const media = formData.get("media") as File | null;

    if (!media) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file is actually a File object
    if (!(media instanceof File)) {
      return NextResponse.json(
        { error: "Invalid file format" },
        { status: 400 }
      );
    }

    // File size validation (10MB for images, 50MB for videos)
    const isVideo = media.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images

    if (media.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${
            maxSize / 1024 / 1024
          }MB for ${isVideo ? "videos" : "images"}`,
        },
        { status: 400 }
      );
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
      "video/x-flv",
    ];

    if (!allowedTypes.includes(media.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create upload record in database
    const upload = await tursoDB.createUpload({
      filename: media.name,
      size: media.size,
      mime: media.type,
      metadata: {
        originalName: media.name,
        uploadedAt: new Date().toISOString(),
        userId: dbUser.id,
        userEmail: userEmail,
      },
    });

    // Deduct token for non-demo users
    if (!tursoDB.isDemoUser(userEmail)) {
      const deductionResult = await tursoDB.deductTokens(dbUser.id, 1);
      if (!deductionResult.success) {
        // If token deduction fails, delete the upload and return error
        await tursoDB.deleteUpload(upload.id);
        return NextResponse.json(
          {
            error: deductionResult.error || "Failed to deduct tokens",
            currentTokens: deductionResult.remainingTokens,
          },
          { status: 402 }
        );
      }
    }

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

    // Get updated user info to return current token count
    const updatedUser = await tursoDB.getUserByEmail(userEmail);

    return NextResponse.json({
      uploadId: upload.id,
      filename: upload.filename,
      size: upload.size,
      mime: upload.mime,
      remainingTokens: updatedUser?.tokens || 0,
      isDemoUser: tursoDB.isDemoUser(userEmail),
    });
  } catch (err: unknown) {
    console.error("/api/uploads error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
