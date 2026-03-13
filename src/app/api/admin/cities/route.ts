import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userCityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    let whereClause: any = {};

    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Todos
    } else if (role === "REGIONAL_LEADER") {
      whereClause.OR = [
        { id: { in: userCityIds } },
        { regionalLeaderId: session.user.id }
      ];
    } else {
      whereClause.id = { in: userCityIds };
    }

    const cities = await (prisma as any).city.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { events: true, users: true }
        },
        regionalLeader: {
          select: { name: true, email: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Cities API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar cidades" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Apenas MASTER ADMIN pode criar cidades" }, { status: 403 });
  }

  try {
    const { name, slug, regionName, regionalLeaderId } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e Slug são obrigatórios" }, { status: 400 });
    }

    const city = await (prisma as any).city.create({
      data: {
        name,
        slug,
        regionName,
        regionalLeaderId: regionalLeaderId || null
      }
    });

    return NextResponse.json({ city });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "O slug da cidade deve ser único" }, { status: 400 });
    }
    console.error("Create City API Error:", error);
    return NextResponse.json({ 
      error: "Erro ao criar cidade",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
