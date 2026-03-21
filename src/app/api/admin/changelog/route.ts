
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const changelogSchema = z.object({
  type: z.enum(["Feature", "Bugfix", "Improvement"]),
  title: z.string().min(1),
  description: z.string().min(1),
  version: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const changes = await prisma.changelog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(changes, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' }
    });
  } catch (error) {
    console.error("Changelog GET Error:", error);
    return NextResponse.json({ error: "Erro ao buscar atualizações." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = changelogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const entry = await prisma.changelog.create({
      data: parsed.data
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Changelog POST Error:", error);
    return NextResponse.json({ error: "Erro ao criar atualização." }, { status: 500 });
  }
}
