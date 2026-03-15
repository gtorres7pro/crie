import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updateData: any = { ...body };
    
    // Type conversions for numeric fields coming from form bodies
    if (updateData.capacity !== undefined) updateData.capacity = Number(updateData.capacity);
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.date) updateData.date = new Date(updateData.date).toISOString();

    const { data, error } = await supabaseAdmin
      .from("Event")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Update Error details:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Update Event Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar evento." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const { error } = await supabaseAdmin
      .from("Event")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return NextResponse.json({ error: "Erro ao eliminar evento." }, { status: 500 });
  }
}
