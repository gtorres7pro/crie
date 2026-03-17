
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
    const search = searchParams.get("search");

    // Lógica original de permissões
    let eventWhere: any = {};
    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      eventWhere = {};
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
        city: { users: { some: { id: session.user.id } } }
      };
    }

    // Merge de CityId
    if (cityId && cityId !== "all") {
      eventWhere.cityId = cityId;
    }

    // Filtro global para attendees
    const where: any = { event: eventWhere };
    if (eventId && eventId !== "all") {
      where.eventId = eventId;
    }

    // Busca textual - apenas se tiver 3+ chars
    if (search && search.trim().length >= 3) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Buscar os inscritos
    const attendees = await prisma.attendee.findMany({
      where,
      include: {
        event: {
          select: { title: true, cityId: true, city: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: (search && search.trim().length >= 3) ? 15 : 100
    });

    // Buscar os eventos permitidos para o filtro do dropdown (sem a busca de texto)
    const events = await prisma.event.findMany({
      where: role === "MASTER_ADMIN" || role === "GLOBAL_LEADER" ? {} : eventWhere,
      select: { id: true, title: true, date: true, cityId: true },
      orderBy: { date: 'desc' }
    });
    
    const members = await prisma.member.findMany({ select: { email: true } });
    const memberEmails = new Set(members.map(m => m.email.toLowerCase()));
    
    const attendeesWithMemberStatus = attendees.map(a => ({
      ...a,
      isMember: memberEmails.has(a.email.toLowerCase())
    }));

    return NextResponse.json({
      attendees: attendeesWithMemberStatus,
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
