import { NextResponse } from "next/server";
import { lookupCurrentUser } from "@/lib/auth/user";

export async function GET() {
  const result = await lookupCurrentUser();

  if (result.status === "unauthenticated") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (result.status === "forbidden") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(result.user);
}
