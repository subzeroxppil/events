import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

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

    // Construct the CSV file path based on the lucky draw name
    const csvPath = join(
      process.cwd(),
      "src",
      "app",
      "assets",
      "corpPassToNameMapping",
      `${luckyDrawName}.csv`
    );

    // Check if the CSV file exists
    if (!existsSync(csvPath)) {
      return NextResponse.json({ mapping: {} });
    }

    // Read and parse the CSV file
    const csvContent = readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    // Skip header line and create mapping
    const mapping: Record<string, string> = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma and handle potential commas in names
      const commaIndex = line.indexOf(",");
      if (commaIndex === -1) continue;

      const email = line.substring(0, commaIndex).trim();
      const name = line.substring(commaIndex + 1).trim();

      if (email && name) {
        // Extract corp ID (part before @)
        const corpId = email.split("@")[0];
        mapping[corpId] = name;
      }
    }

    return NextResponse.json({ mapping });
  } catch (error) {
    console.error("Error reading corp ID mapping:", error);
    return NextResponse.json(
      { error: "Failed to load mapping" },
      { status: 500 }
    );
  }
}
