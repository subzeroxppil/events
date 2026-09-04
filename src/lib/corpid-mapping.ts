import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Corp ID -> full name, read from the per-lucky-draw CSV in
 * `src/app/assets/corpPassToNameMapping/<lucky draw name>.csv`.
 * Returns an empty mapping when no CSV exists for the draw.
 */
export function readCorpIdMapping(
  luckyDrawName: string
): Record<string, string> {
  const csvPath = join(
    process.cwd(),
    "src",
    "app",
    "assets",
    "corpPassToNameMapping",
    `${luckyDrawName}.csv`
  );

  if (!existsSync(csvPath)) return {};

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

  return mapping;
}
