import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all attendees
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  const userId = session?.user?.id as string;
  const userCityIds = session?.user?.cityIds || [];

  console.log("Attendees API: Session User:", JSON.stringify(session?.user));
  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    console.log("Attendees API: Unauthorized. Role:", role);
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const cityId = searchParams.get("cityId");

    let attendeeWhere: any = {};
    let eventWhere: any = {};

    // 1. Isolação por Role
    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Acesso Total
    } else if (role === "REGIONAL_LEADER") {
      // Apenas cidades lideradas regionalmente
      const ledCities = await (prisma as any).city.findMany({
        where: { regionalLeaderId: userId },
        select: { id: true }
      });
      const ledCityIds = ledCities.map((c: any) => c.id);
      eventWhere.cityId = { in: ledCityIds };
    } else {
      // LOCAL_LEADER & APOIADOR: Apenas suas cidades
      eventWhere.cityId = { in: userCityIds };
    }

    // 2. Filtros ad-hoc
    if (eventId && eventId !== "all") {
      attendeeWhere.eventId = eventId;
    } else if (cityId && cityId !== "all") {
       eventWhere.cityId = cityId;
    }

    // Unir filtros de evento no attendee
    attendeeWhere.event = eventWhere;

    const attendees = await (prisma as any).attendee.findMany({
      where: attendeeWhere,
      include: {
        event: {
          select: { title: true, cityId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Fetch accessible events for filters
    const accessibleEvents = await (prisma as any).event.findMany({
      where: eventWhere,
      select: { id: true, title: true, date: true, cityId: true },
      orderBy: { date: "desc" }
    });

    return NextResponse.json({
      attendees,
      events: accessibleEvents || []
    });
  } catch (error: any) {
    console.error("Attendees GET API Error:", error.message, error.stack);
    return NextResponse.json({ error: "Erro ao buscar dados.", details: error.message }, { status: 500 });
  }
}

// PATCH: Update attendee status (payment or presence)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id, paymentStatus, presenceStatus } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updated = await (prisma as any).attendee.update({
      where: { id },
      data: {
        ...(paymentStatus && { paymentStatus }),
        ...(presenceStatus && { presenceStatus }),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Dashboard Patch Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar dados." }, { status: 500 });
  }
}
