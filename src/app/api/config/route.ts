import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/pattern-data";

export async function GET() {
  return NextResponse.json({ useLiveApi: Boolean(resolveApiKey()) });
}
