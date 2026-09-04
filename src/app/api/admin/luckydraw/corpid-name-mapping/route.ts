import { NextRequest, NextResponse } from "next/server";
import { readCorpIdMapping } from "@/lib/corpid-mapping";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encodedLuckyDrawName = searchParams.get("name");

    if (!encodedLuckyDrawName) {
      return NextResponse.json(
        { error: "Lucky draw name is required" },
        { status: 400 }
      );
    }

    // Decode the lucky draw name
    const luckyDrawName = decodeURIComponent(encodedLuckyDrawName);

    const mapping = readCorpIdMapping(luckyDrawName);

    return NextResponse.json({ mapping });
  } catch (error) {
    console.error("Error reading corp ID mapping:", error);
    return NextResponse.json(
      { error: "Failed to load mapping" },
      { status: 500 }
    );
  }
}
