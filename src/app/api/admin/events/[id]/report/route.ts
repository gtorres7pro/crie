import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null as any;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Fetch event details with stats
    const { data: event, error } = await supabaseAdmin
      .from("Event")
      .select("*, attendees:Attendee(*), finances:Finance(*)")
      .eq("id", id)
      .single();

    if (error || !event) throw new Error("Evento não encontrado");

    const totalInscritos = event.attendees?.length || 0;
    const presentes = event.attendees?.filter((a: any) => a.presenceStatus === "Presente").length || 0;
    const pagos = event.attendees?.filter((a: any) => a.paymentStatus === "Pago").length || 0;
    
    // Financial calculations
    const salesRevenue = pagos * (event.price || 0);
    const manualRevenue = event.finances?.filter((f: any) => f.type === "Receita").reduce((acc: number, f: any) => acc + f.amount, 0) || 0;
    const manualExpenses = event.finances?.filter((f: any) => f.type === "Despesa").reduce((acc: number, f: any) => acc + f.amount, 0) || 0;
    
    const receitas = salesRevenue + manualRevenue;
    const despesas = manualExpenses;
    const saldo = receitas - despesas;

    // Send Email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `CRIE Braga <${process.env.OFFICIAL_EMAIL}>`,
      to: [process.env.OFFICIAL_EMAIL!], // Sending to admin email
      subject: `Relatório Financeiro: ${event.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #f59e0b; text-transform: uppercase;">Relatório de Fecho: ${event.title}</h2>
          <p><strong>Data do Evento:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0;">Total de Inscritos:</td><td style="text-align: right; font-weight: bold;">${totalInscritos}</td></tr>
            <tr><td style="padding: 10px 0;">Total de Presentes:</td><td style="text-align: right; font-weight: bold;">${presentes}</td></tr>
            <tr style="color: #059669;"><td style="padding: 10px 0;">Receitas (Inscrições):</td><td style="text-align: right; font-weight: bold;">${receitas.toFixed(2)}€</td></tr>
            <tr style="color: #dc2626;"><td style="padding: 10px 0;">Despesas:</td><td style="text-align: right; font-weight: bold;">-${despesas.toFixed(2)}€</td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 10px; font-weight: bold; font-size: 18px;">SALDO FINAL:</td><td style="text-align: right; font-weight: bold; font-size: 18px;">${saldo.toFixed(2)}€</td></tr>
          </table>

          <h3 style="margin-top: 30px;">Detalhe de Despesas:</h3>
          ${event.finances?.map((f: any) => `
            <div style="padding: 10px; border-bottom: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 14px;"><strong>${f.description}</strong>: ${f.amount.toFixed(2)}€</p>
              ${f.notes ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${f.notes}</p>` : ""}
            </div>
          `).join('') || '<p>Nenhuma despesa registada.</p>'}

          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Relatório gerado em ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (emailError) throw emailError;

    // Lock the event
    await supabaseAdmin
      .from("Event")
      .update({ financialLocked: true, reportSentAt: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Report Email Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao enviar relatório." }, { status: 500 });
  }
}
