import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all events with summary stats
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  const userCityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const cityIdParam = searchParams.get("cityId");

    let where: any = {};

    // 1. Isolação por Role
    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Acesso Total
    } else if (role === "REGIONAL_LEADER") {
      // Apenas cidades lideradas regionalmente
      const ledCities = await prisma.city.findMany({
        where: { regionalLeaders: { some: { id: session.user.id } } },
        select: { id: true }
      });
      const ledCityIds = ledCities.map(c => c.id);
      where.cityId = { in: ledCityIds };
    } else {
      // LOCAL_LEADER & APOIADOR: Apenas suas cidades
      where.cityId = { in: userCityIds };
    }

    // 2. Filtro ad-hoc
    if (cityIdParam && cityIdParam !== "all") {
      where.cityId = cityIdParam;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        city: { select: { name: true } },
        attendees: { select: { id: true, presenceStatus: true, paymentStatus: true } },
        finances: { select: { id: true, type: true, amount: true, createdAt: true, description: true, notes: true, receiptUrl: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Process stats for each event
    const eventsWithStats = events.map((event: any) => {
      const totalAttendees = event.attendees?.length || 0;
      const present = event.attendees?.filter((a: any) => a.presenceStatus === "Presente").length || 0;
      const missing = totalAttendees - present;
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
    console.error("Events GET API Error (FULL DETAILS):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error.cause) console.error("CAUSE:", error.cause);
    return NextResponse.json({ error: "Erro ao buscar eventos.", details: error.message, code: error.code }, { status: 500 });
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
    const { title, description, date, location, capacity, price, status, bannerUrl, cityId } = body;

    if (!title || !date || !location || !cityId) {
      return NextResponse.json({ error: "Título, data, local e cidade são obrigatórios" }, { status: 400 });
    }

    // Validação de permissão para criar evento na cidade
    if (role !== "MASTER_ADMIN" && role !== "GLOBAL_LEADER") {
      if (role === "REGIONAL_LEADER") {
         const city = await prisma.city.findFirst({
           where: { id: cityId, regionalLeaders: { some: { id: userId } } }
         });
         if (!city) return NextResponse.json({ error: "Não tens permissão para esta cidade" }, { status: 403 });
      } else if (!userCityIds.includes(cityId)) {
         return NextResponse.json({ error: "Não tens permissão para esta cidade" }, { status: 403 });
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        capacity: Number(capacity),
        price: Number(price),
        status: status || "DRAFT",
        bannerUrl,
        cityId
      }
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ error: "Erro ao criar evento.", details: error.message }, { status: 500 });
  }
}
