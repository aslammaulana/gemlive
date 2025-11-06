import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "memory.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([], { status: 200 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const memory = JSON.parse(fileContent);
    return NextResponse.json(memory, { status: 200 });
  } catch (error: any) {
    console.error("Error reading memory.json:", error);
    return NextResponse.json({ error: "Failed to load memory" }, { status: 500 });
  }
}
