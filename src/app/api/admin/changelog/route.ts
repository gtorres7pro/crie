
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    console.log("FETCHING CHANGELOG...");
    const changes = await prisma.changelog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log("CHANGELOG COUNT:", changes.length);
    return NextResponse.json(changes);
  } catch (error: any) {
    console.error("Changelog GET Error:", error);
    return NextResponse.json({ error: "Erro ao buscar atualizações.", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { type, title, description, version } = await req.json();
    const entry = await prisma.changelog.create({
      data: { type, title, description, version }
    });
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao criar atualização." }, { status: 500 });
  }
}
