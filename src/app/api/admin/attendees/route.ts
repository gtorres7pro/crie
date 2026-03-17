
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
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const cityId = searchParams.get("cityId");

    // Lógica simplificada: como Prisma já lida com relacionamentos, validamos o acesso pelo evento/cidade permitidos
    let eventWhere: any = {};
    
    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Todos
    } else if (role === "REGIONAL_LEADER") {
      eventWhere = {
        city: {
          OR: [
            { regionalLeaders: { some: { id: session.user.id } } },
            { users: { some: { id: session.user.id } } }
          ]
        }
      };
    } else {
      eventWhere = {
        city: {
          users: { some: { id: session.user.id } }
        }
      };
    }

    if (eventId && eventId !== "all") {
      eventWhere.id = eventId;
    } else if (cityId && cityId !== "all") {
      eventWhere.cityId = cityId;
    }

    // Buscar os inscritos cujos eventos correspondem aos critérios
    const attendees = await prisma.attendee.findMany({
      where: {
        event: eventWhere
      },
      include: {
        event: {
          select: { title: true, cityId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar os eventos permitidos para o filtro do dropdown
    const events = await prisma.event.findMany({
      where: role === "MASTER_ADMIN" || role === "GLOBAL_LEADER" ? {} : eventWhere,
      select: { id: true, title: true, date: true, cityId: true },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      attendees,
      events
    });
  } catch (error: any) {
    console.error("Attendees GET API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados.", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id, paymentStatus, presenceStatus, name, email, phone, industry } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updateData: any = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (presenceStatus) updateData.presenceStatus = presenceStatus;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (industry) updateData.industry = industry;

    const data = await prisma.attendee.update({
      where: { id },
      data: updateData
    });


    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Dashboard Patch Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar dados.", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado para deletar inscrições" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.attendee.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Attendee Error:", error);
    return NextResponse.json({ error: "Erro ao cancelar inscrição.", details: error.message }, { status: 500 });
  }
}
