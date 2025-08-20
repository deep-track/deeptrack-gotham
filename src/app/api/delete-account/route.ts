import { NextResponse, NextRequest } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req); 
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clerkClient(); 
    await client.users.deleteUser(userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error deleting account:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
