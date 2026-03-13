import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { eventId, amount, description, notes, receiptUrl, type } = await req.json();

    if (!eventId || !amount || !description || !type) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Check if event is locked
    const { data: event } = await supabaseAdmin
      .from("Event")
      .select("financialLocked")
      .eq("id", eventId)
      .single();

    if (event?.financialLocked) {
      return NextResponse.json({ error: "Este evento está com o financeiro fechado." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("Finance")
      .insert({
        id: crypto.randomUUID(),
        eventId,
        amount: Math.abs(Number(amount)),
        description,
        notes,
        receiptUrl,
        type
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Finance Create Error:", error);
    return NextResponse.json({ error: "Erro ao adicionar lançamento." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id, amount, description, type, receiptUrl } = await req.json();

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const { data: finance } = await supabaseAdmin
      .from("Finance")
      .select("eventId")
      .eq("id", id)
      .single();

    const { data: event } = await supabaseAdmin
      .from("Event")
      .select("financialLocked")
      .eq("id", finance?.eventId)
      .single();

    if (event?.financialLocked) {
      return NextResponse.json({ error: "Financeiro fechado." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("Finance")
      .update({
        amount: Math.abs(Number(amount)),
        description,
        type,
        receiptUrl
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Finance Update Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar lançamento." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("Finance")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Finance Delete Error:", error);
    return NextResponse.json({ error: "Erro ao eliminar despesa." }, { status: 500 });
  }
}
