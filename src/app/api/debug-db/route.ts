import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await (prisma as any).$queryRaw`SELECT 1 as "test"`;
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("DEBUG DB ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message, stack: err.stack, cause: err.cause }, { status: 500 });
  }
}
