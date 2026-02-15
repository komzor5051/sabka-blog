import { NextResponse } from "next/server";
import { mineTopics } from "@/lib/pipeline/topic-miner";

export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await mineTopics();
    return NextResponse.json({ success: true, message: "Topics mined" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
