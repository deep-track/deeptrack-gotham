// src/app/api/delete-account/route.ts
import { getAuth, clerkClient as getClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req); // pass the Request directly
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerkClient = await getClerkClient();
    await clerkClient.users.deleteUser(userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error deleting account:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
