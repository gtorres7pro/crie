import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all events with summary stats
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
    const cityIdParam = searchParams.get("cityId");

    let whereClause: any = {};

    // 1. Isolação por Role
    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Acesso Total
    } else if (role === "REGIONAL_LEADER") {
      // Apenas cidades lideradas regionalmente
      const ledCities = await (prisma as any).city.findMany({
        where: { regionalLeaderId: session.user.id },
        select: { id: true }
      });
      const ledCityIds = ledCities.map((c: any) => c.id);
      whereClause.cityId = { in: ledCityIds };
    } else {
      // LOCAL_LEADER & APOIADOR: Apenas suas cidades
      whereClause.cityId = { in: userCityIds };
    }

    // 2. Filtro ad-hoc
    if (cityIdParam && cityIdParam !== "all") {
       // Se já houver restrição por cityId (role não-global), combina com o filtro se for permitido
       if (whereClause.cityId) {
          if (typeof whereClause.cityId === "string") {
            if (whereClause.cityId !== cityIdParam) whereClause.cityId = "none"; // Trigger empty result if mismatch
          } else if (whereClause.cityId.in) {
            if (!whereClause.cityId.in.includes(cityIdParam)) whereClause.cityId = "none";
            else whereClause.cityId = cityIdParam;
          }
       } else {
         whereClause.cityId = cityIdParam;
       }
    }

    const events = await (prisma as any).event.findMany({
      where: whereClause,
      include: {
        city: { select: { name: true } },
        attendees: {
          select: { id: true, presenceStatus: true, paymentStatus: true }
        },
        finances: true
      },
      orderBy: { date: "asc" }
    });

    // Process stats for each event
    const eventsWithStats = events.map((event: any) => {
      const totalAttendees = event.attendees?.length || 0;
      const present = event.attendees?.filter((a: any) => a.presenceStatus === "Presente").length || 0;
      const missing = event.attendees?.filter((a: any) => a.presenceStatus === "Faltou").length || 0;
      const salesRevenue = event.attendees?.filter((a: any) => a.paymentStatus === "Pago").length * (event.price || 0);
      const manualRevenue = event.finances?.filter((f: any) => f.type === "Receita").reduce((acc: number, f: any) => acc + f.amount, 0) || 0;
      const manualExpenses = event.finances?.filter((f: any) => f.type === "Despesa").reduce((acc: number, f: any) => acc + f.amount, 0) || 0;
      
      const totalRevenue = salesRevenue + manualRevenue;
      const totalExpenses = manualExpenses;
      
      return {
        ...event,
        stats: {
          total: totalAttendees,
          present,
          missing,
          occupancy: event.capacity > 0 ? (totalAttendees / event.capacity) * 100 : 0,
          revenue: totalRevenue,
          expenses: totalExpenses,
          balance: totalRevenue - totalExpenses
        }
      };
    });

    return NextResponse.json(eventsWithStats);
  } catch (error: any) {
    console.error("Events GET API Error:", error.message, error.stack);
    return NextResponse.json({ error: "Erro ao buscar eventos.", details: error.message }, { status: 500 });
  }
}

// POST: Create a new event
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  const userId = session?.user?.id as string;
  const userCityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, date, location, capacity, price, status, cityId } = body;

    if (!title || !date || !location || !cityId) {
      return NextResponse.json({ error: "Título, data, local e cidade são obrigatórios" }, { status: 400 });
    }

    // Validação de permissão para criar evento na cidade
    if (role !== "MASTER_ADMIN" && role !== "GLOBAL_LEADER") {
      if (role === "REGIONAL_LEADER") {
         const city = await (prisma as any).city.findFirst({
           where: { id: cityId, regionalLeaderId: userId }
         });
         if (!city) return NextResponse.json({ error: "Não tens permissão para esta cidade" }, { status: 403 });
      } else if (!userCityIds.includes(cityId)) {
         return NextResponse.json({ error: "Não tens permissão para esta cidade" }, { status: 403 });
      }
    }

    const data = await (prisma as any).event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        capacity: Number(capacity),
        price: Number(price),
        status: status || "DRAFT",
        cityId
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ error: "Erro ao criar evento." }, { status: 500 });
  }
}
