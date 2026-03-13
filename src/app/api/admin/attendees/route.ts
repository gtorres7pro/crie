import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

// GET: List all attendees
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  const userId = session?.user?.id as string;
  const userCityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const cityId = searchParams.get("cityId");

    // 1. Fetch accessible event IDs based on role
    let eventQuery = supabaseAdmin
      .from('Event')
      .select('id, title, date, cityId');

    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Full Access
    } else if (role === "REGIONAL_LEADER") {
      const { data: ledCities } = await supabaseAdmin
        .from('City')
        .select('id')
        .eq('regionalLeaderId', userId);
      const ledCityIds = ledCities?.map(c => c.id) || [];
      eventQuery = eventQuery.in('cityId', ledCityIds);
    } else {
      eventQuery = eventQuery.in('cityId', userCityIds);
    }

    const { data: accessibleEvents, error: eventError } = await eventQuery.order('date', { ascending: false });
    if (eventError) throw eventError;

    const accessibleEventIds = accessibleEvents?.map(e => e.id) || [];

    // 2. Query Attendees
    let attendeeQuery = supabaseAdmin
      .from('Attendee')
      .select(`
        *,
        event:Event(title, cityId)
      `)
      .order('createdAt', { ascending: false });

    // Filter by specific event if provided, otherwise filter by all accessible events
    if (eventId && eventId !== "all") {
      attendeeQuery = attendeeQuery.eq('eventId', eventId);
    } else if (cityId && cityId !== "all") {
      // Filter by cityId (only for events in that city)
      const eventIdsInCity = accessibleEvents?.filter(e => e.cityId === cityId).map(e => e.id) || [];
      attendeeQuery = attendeeQuery.in('eventId', eventIdsInCity);
    } else {
      // Must only show attendees for events the user can see
      attendeeQuery = attendeeQuery.in('eventId', accessibleEventIds);
    }

    const { data: attendees, error: attendeeError } = await attendeeQuery;
    if (attendeeError) throw attendeeError;

    return NextResponse.json({
      attendees: attendees || [],
      events: accessibleEvents || []
    });
  } catch (error: any) {
    console.error("Attendees GET API Error:", error.message);
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

    const updateData: any = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (presenceStatus) updateData.presenceStatus = presenceStatus;

    const { data, error } = await supabaseAdmin
      .from('Attendee')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Dashboard Patch Error:", error.message);
    return NextResponse.json({ error: "Erro ao atualizar dados.", details: error.message }, { status: 500 });
  }
}
