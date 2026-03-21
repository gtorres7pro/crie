import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  location: z.string().min(1),
  cityId: z.string().min(1),
  capacity: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).default("DRAFT"),
  bannerUrl: z.string().url().optional().or(z.literal("")),
});

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
        _count: { select: { finances: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Fetch finance aggregates separately (much lighter than full records)
    const eventIds = events.map((e: any) => e.id);
    const financeAggregates = await prisma.finance.groupBy({
      by: ['eventId', 'type'],
      where: { eventId: { in: eventIds } },
      _sum: { amount: true }
    });

    const financeMap = new Map<string, { revenue: number; expenses: number }>();
    for (const f of financeAggregates) {
      const existing = financeMap.get(f.eventId) ?? { revenue: 0, expenses: 0 };
      if (f.type === 'Receita') existing.revenue += f._sum.amount ?? 0;
      if (f.type === 'Despesa') existing.expenses += f._sum.amount ?? 0;
      financeMap.set(f.eventId, existing);
    }

    // Process stats for each event
    const eventsWithStats = events.map((event: any) => {
      const totalAttendees = event.attendees?.length || 0;
      const present = event.attendees?.filter((a: any) => a.presenceStatus === "Presente").length || 0;
      const missing = totalAttendees - present;
      const salesRevenue = (event.attendees?.filter((a: any) => a.paymentStatus === "Pago").length || 0) * (event.price || 0);
      const finTotals = financeMap.get(event.id) ?? { revenue: 0, expenses: 0 };
      const totalRevenue = salesRevenue + finTotals.revenue;
      const totalExpenses = finTotals.expenses;

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
    console.error("Events GET API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar eventos." }, { status: 500 });
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
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
    }
    const { title, description, date, location, capacity, price, status, bannerUrl, cityId } = parsed.data;

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
        capacity,
        price,
        status,
        bannerUrl: bannerUrl || null,
        cityId
      }
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ error: "Erro ao criar evento." }, { status: 500 });
  }
}
