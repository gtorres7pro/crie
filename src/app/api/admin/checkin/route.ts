import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

// GET: Listar inscritos do próximo evento LIVE
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const userCityIds = session?.user?.cityIds || [];

    if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role as string)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventIdParam = searchParams.get("eventId");

    // Buscar o evento ativo
    let eventQuery = supabaseAdmin
      .from("Event")
      .select("id, title")
      .order("date", { ascending: true })
      .limit(1);

    if (eventIdParam) {
       eventQuery = eventQuery.eq("id", eventIdParam);
    } else {
       eventQuery = eventQuery.eq("status", "LIVE");
    }

    // Filter by city if not global
    if (["LOCAL_LEADER", "APOIADOR"].includes(role as string) && userCityIds.length > 0) {
      eventQuery = eventQuery.in("cityId", userCityIds);
    }

    const { data: event, error: eventError } = await eventQuery.maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ attendees: [], eventTitle: "Nenhum evento ativo" });
    }

    // Buscar inscritos
    const { data: attendees, error: attendeesError } = await supabaseAdmin
      .from("Attendee")
      .select("*")
      .eq("eventId", event.id)
      .order("presenceStatus", { ascending: true }) // Pendente primeiro, Presente depois
      .order("name", { ascending: true });

    if (attendeesError) {
      throw attendeesError;
    }

    return NextResponse.json({ attendees, eventTitle: event.title, eventId: event.id });
  } catch (error) {
    console.error("Erro ao buscar inscritos para check-in:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH: Atualizar status de presença ou pagamento
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role as string)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, presenceStatus, paymentStatus } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID do inscrito é obrigatório" }, { status: 400 });
    }

    const updateData: any = {};
    if (presenceStatus) updateData.presenceStatus = presenceStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const { data: attendee, error } = await supabaseAdmin
      .from("Attendee")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, attendee });
  } catch (error) {
    console.error("Erro ao atualizar inscrito:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST: Add attendee manually (bypasses capacity)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role as string)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { eventId, name, email, phone, industry } = await req.json();

    if (!eventId || !name || !email || !phone || !industry) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Verificar se já existe (opcional, mas bom ter para evitar duplicados acidentais)
    const { data: existingAttendee } = await supabaseAdmin
      .from("Attendee")
      .select("id")
      .eq("email", email)
      .eq("eventId", eventId)
      .single();

    if (existingAttendee) {
      return NextResponse.json({ error: "Este email já está inscrito no evento." }, { status: 400 });
    }

    // Criar registo do inscrito
    const { data: attendee, error: insertError } = await supabaseAdmin
      .from("Attendee")
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        industry,
        interests: ["Networking"], 
        eventId,
        paymentStatus: "Pendente",
        presenceStatus: "Presente", // Assumimos que se está a ser adicionado no check-in, já está presente!
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true, attendee });
  } catch (error) {
    console.error("Erro ao adicionar inscrito no checkin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
