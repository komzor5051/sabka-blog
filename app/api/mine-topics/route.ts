import { NextResponse } from "next/server";
import { mineTopics } from "@/lib/pipeline/topic-miner";

export const maxDuration = 300;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== "sabka2026go") {
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
