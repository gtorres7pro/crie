import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin strictly for Server-Side Use
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Telefone deve estar no formato E.164 (ex: +351912345678)"),
  industry: z.string().min(2, "Área/Indústria é obrigatória"),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      industry: formData.get("industry") as string,
    };
    
    const file = formData.get("paymentProof") as File | null;
    
    // Validar dados básicos
    const parseResult = registerSchema.safeParse(data);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    // Buscar o evento ativo (LIVE e que não passou)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: event, error: eventError } = await supabaseAdmin
      .from("Event")
      .select("*")
      .eq("status", "LIVE")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Nenhum evento ativo disponível para inscrição." }, { status: 404 });
    }

    // Verificar se atingiu a capacidade
    const { count: attendeeCount } = await supabaseAdmin
      .from("Attendee")
      .select("*", { count: 'exact', head: true })
      .eq("eventId", event.id);

    if (attendeeCount !== null && attendeeCount >= event.capacity) {
      return NextResponse.json({ error: "Lamento, as vagas para este evento já se encontram esgotadas." }, { status: 400 });
    }

    // Verificar se o email já está inscrito neste evento
    const { data: existingAttendee } = await supabaseAdmin
      .from("Attendee")
      .select("id")
      .eq("email", data.email)
      .eq("eventId", event.id)
      .single();

    if (existingAttendee) {
      return NextResponse.json({ error: "Este email já está inscrito no evento." }, { status: 400 });
    }

    // Upload do comprovativo se existir
    let paymentProofUrl = null;
    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("payments")
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("payments")
          .getPublicUrl(fileName);
        paymentProofUrl = publicUrl;
      } else {
        console.error("Erro no upload do comprovativo:", uploadError);
      }
    }

    // Criar registo do inscrito
    const { data: attendee, error: insertError } = await supabaseAdmin
      .from("Attendee")
      .insert({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        interests: ["Networking", "Crescimento"], // default interests
        eventId: event.id,
        paymentStatus: paymentProofUrl ? "Pendente" : "Pendente", // Could be handled by admin
        presenceStatus: "Pendente",
        paymentProofUrl: paymentProofUrl,
      })
      .select()
      .single();

    if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        return NextResponse.json({ error: "Erro ao salvar a inscrição." }, { status: 500 });
    }

    // Tentar enviar email de confirmação (Sem bloquear se falhar)
    try {
      await sendEmail({
        to: data.email,
        subject: "Confirmação de Inscrição - CRIE Braga",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #b45309;">Olá ${data.name}!</h1>
            <p>Recebemos a sua pré-inscrição para o <b>${event.title}</b>.</p>
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin-top: 0;">Para confirmar a sua presença, por favor envie o investimento de <strong>6€</strong> por MB Way para:</p>
                <h3 style="margin-bottom: 0;">+351 918 704 170 (Gabriel Torres)</h3>
                ${paymentProofUrl ? '<p style="font-size: 12px; color: #666; margin-top: 10px;"><i>Recebemos o seu anexo de comprovativo e iremos validá-lo em breve.</i></p>' : ""}
            </div>
            <p><strong>Data:</strong> 16 de Março de 2026 às 19:30h</p>
            <p><strong>Local:</strong> Lagoinha Braga (Trav. rua do Parque Comercial, Pavilhão 1, Nogueira - Braga)</p>
            <br/>
            <p>Estamos entusiasmados por nos conectarmos!</p>
            <p><strong>Equipa CRIE Braga</strong></p>
          </div>
        `
      });
    } catch (e) {
      console.error("Falha ao enviar email, mas inscrição foi guardada.", e);
    }

    return NextResponse.json({ success: true, attendee }, { status: 201 });

  } catch (error) {
    console.error("Erro no registo:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
