import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { attendeeIds } = await req.json();

    if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      return NextResponse.json({ error: "Nenhum participante selecionado" }, { status: 400 });
    }

    // 1. Buscar detalhes dos participantes
    const { data: collaborators, error: collError } = await supabaseAdmin
      .from("Attendee")
      .select("name, email")
      .in("id", attendeeIds);

    if (collError) throw collError;

    // 2. Buscar o próximo evento LIVE
    const now = new Date();
    const { data: nextEvent, error: eventError } = await supabaseAdmin
      .from("Event")
      .select("*")
      .eq("status", "LIVE")
      .gte("date", now.toISOString())
      .order("date", { ascending: true })
      .limit(1)
      .single();

    if (eventError || !nextEvent) {
      return NextResponse.json({ error: "Não há nenhum evento LIVE agendado para o futuro." }, { status: 404 });
    }

    // 3. Enviar convites (Simulado em lote para evitar timeout, em produção seria ideal um queue)
    const results = await Promise.all(collaborators.map(async (c) => {
      return sendEmail({
        to: c.email,
        subject: `Convite Especial: ${nextEvent.title} - CRIE Braga`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b;">Olá, ${c.name}!</h2>
            <p>Temos o prazer de te convidar para o nosso próximo encontro: <strong>${nextEvent.title}</strong>.</p>
            <p>${nextEvent.description || "Um momento de networking e crescimento em Braga."}</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>📍 <strong>Local:</strong> ${nextEvent.location}</p>
              <p>📅 <strong>Data:</strong> ${new Date(nextEvent.date).toLocaleDateString()} às ${new Date(nextEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <p>Gostaríamos muito de contar com a tua presença novamente!</p>
            <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Ver Detalhes e Inscrever</a>
            
            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Equipa CRIE Braga</p>
          </div>
        `
      });
    }));

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      total: collaborators.length,
      eventTitle: nextEvent.title
    });

  } catch (error: any) {
    console.error("Invite API Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao enviar convites" }, { status: 500 });
  }
}
