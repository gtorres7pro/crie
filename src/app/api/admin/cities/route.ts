
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    let where: any = {};

    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Ver todas
    } else if (role === "REGIONAL_LEADER") {
      // Cidades que lidera ou que está atrelado
      where = {
        OR: [
          { regionalLeaders: { some: { id: session.user.id } } },
          { users: { some: { id: session.user.id } } }
        ]
      };
    } else {
      // Local Leader ou Apoiador: Apenas cidades atreladas
      where = {
        users: { some: { id: session.user.id } }
      };
    }

    const cities = await prisma.city.findMany({
      where,
      include: {
        regionalLeaders: {
          select: { id: true, name: true, email: true }
        },
        users: { // Em Prisma, representam os Local Leaders atrelados via UserCities
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            events: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Remapear para manter compatibilidade com a interface que espera "localLeaders"
    const formattedCities = cities.map(c => ({
      ...c,
      localLeaders: c.users // No frontend, users atrelados à cidade são mostrados como local leaders
    }));

    return NextResponse.json(formattedCities);
  } catch (error: any) {
    console.error("Cities GET Error:", error);
    return NextResponse.json({ error: "Erro ao buscar cidades", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Apenas MASTER ADMIN pode criar cidades" }, { status: 403 });
  }

  try {
    const { name, slug, regionName, regionalLeaderIds, localLeaderIds } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e Slug são obrigatórios" }, { status: 400 });
    }

    const city = await prisma.city.create({
      data: {
        name,
        slug,
        regionName,
        regionalLeaders: regionalLeaderIds && regionalLeaderIds.length > 0 ? {
          connect: regionalLeaderIds.map((id: string) => ({ id }))
        } : undefined,
        users: localLeaderIds && localLeaderIds.length > 0 ? {
          connect: localLeaderIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    return NextResponse.json(city);
  } catch (error: any) {
    console.error("Create City API Error:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: "O slug da cidade deve ser único" }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar cidade", details: error.message }, { status: 500 });
  }
}
