
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { name, regionName, regionalLeaderIds, localLeaderIds } = await req.json();

    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        regionName,
        regionalLeaders: regionalLeaderIds ? {
          set: regionalLeaderIds.map((uid: string) => ({ id: uid }))
        } : undefined,
        users: localLeaderIds ? {
          set: localLeaderIds.map((uid: string) => ({ id: uid }))
        } : undefined
      }
    });

    return NextResponse.json(city);
  } catch (error: any) {
    console.error("Update City Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar cidade", details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Verificar se há eventos atrelados
    const eventsCount = await prisma.event.count({ where: { cityId: id } });
    if (eventsCount > 0) {
      return NextResponse.json({ error: "Não é possível excluir uma cidade que possui eventos cadastrados. Exclua os eventos primeiro." }, { status: 400 });
    }

    // Desconectar líderes regionais e locais
    await prisma.city.update({
      where: { id },
      data: { 
        users: { set: [] },
        regionalLeaders: { set: [] }
      }
    });

    await prisma.city.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete City Error:", error);
    return NextResponse.json({ error: "Erro ao excluir cidade", details: error.message }, { status: 500 });
  }
}
