import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getRegistrationEmailHtml } from "@/lib/email-templates";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin strictly for Storage (if needed for proof upload)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(9, "Telefone inválido").regex(/^[+]?[\d\s-]{9,}$/, "Formato de telefone inválido"),
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const event = await prisma.event.findFirst({
      where: {
        status: "LIVE",
        date: { gte: today }
      },
      include: {
        _count: {
          select: { attendees: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    if (!event) {
      return NextResponse.json({ error: "Nenhum evento ativo disponível para inscrição." }, { status: 404 });
    }

    // Verificar se atingiu a capacidade
    if (event._count.attendees >= event.capacity) {
      return NextResponse.json({ error: "Lamento, as vagas para este evento já se encontram esgotadas." }, { status: 400 });
    }

    // Verificar se o email já está inscrito neste evento
    const existingAttendee = await prisma.attendee.findFirst({
      where: {
        email: data.email,
        eventId: event.id
      }
    });

    if (existingAttendee) {
      return NextResponse.json({ error: "Este email já está inscrito no evento." }, { status: 400 });
    }

    // Upload do comprovativo se existir
    let paymentProofUrl = null;
    if (file && file.size > 0 && supabaseAdmin) {
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
    const attendee = await prisma.attendee.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        interests: ["Networking", "Crescimento"],
        eventId: event.id,
        paymentStatus: "Pendente",
        presenceStatus: "Pendente",
        paymentProofUrl: paymentProofUrl,
      }
    });

    // Tentar enviar email de confirmação (Sem bloquear se falhar)
    try {
      await sendEmail({
        to: data.email,
        subject: "Confirmação de Inscrição - CRIE Braga",
        html: getRegistrationEmailHtml({
          name: data.name,
          eventTitle: event.title,
          eventDate: new Date(event.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + 'h',
          eventLocation: event.location,
          eventPrice: event.price,
          bannerUrl: event.bannerUrl,
          paymentProofUrl: paymentProofUrl
        })
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
