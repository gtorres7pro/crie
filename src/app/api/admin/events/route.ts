import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    let query = supabaseAdmin
      .from('Event')
      .select(`
        *,
        city:City(name),
        attendees:Attendee(id, presenceStatus, paymentStatus),
        finances:Finance(id, type, amount)
      `)
      .order('date', { ascending: true });

    // 1. Isolação por Role
    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Acesso Total
    } else if (role === "REGIONAL_LEADER") {
      // Apenas cidades lideradas regionalmente
      const { data: ledCities } = await supabaseAdmin
        .from('City')
        .select('id')
        .eq('regionalLeaderId', session.user.id);
      
      const ledCityIds = ledCities?.map(c => c.id) || [];
      query = query.in('cityId', ledCityIds);
    } else {
      // LOCAL_LEADER & APOIADOR: Apenas suas cidades
      query = query.in('cityId', userCityIds);
    }

    // 2. Filtro ad-hoc
    if (cityIdParam && cityIdParam !== "all") {
      query = query.eq('cityId', cityIdParam);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    // Process stats for each event
    const eventsWithStats = (events || []).map((event: any) => {
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
        city: event.city, // Supabase returns object directly
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
    console.error("Events GET API Error:", error.message);
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
         const { data: city } = await supabaseAdmin
           .from('City')
           .select('id')
           .match({ id: cityId, regionalLeaderId: userId })
           .single();
         if (!city) return NextResponse.json({ error: "Não tens permissão para esta cidade" }, { status: 403 });
      } else if (!userCityIds.includes(cityId)) {
         return NextResponse.json({ error: "Não tens permissão para esta cidade" }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('Event')
      .insert({
        title,
        description,
        date: new Date(date),
        location,
        capacity: Number(capacity),
        price: Number(price),
        status: status || "DRAFT",
        cityId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Create Event Error:", error.message);
    return NextResponse.json({ error: "Erro ao criar evento.", details: error.message }, { status: 500 });
  }
}
