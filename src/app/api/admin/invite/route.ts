import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { attendeeIds } = await req.json();

    if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      return NextResponse.json({ error: "Nenhum participante selecionado" }, { status: 400 });
    }

    // 1. Buscar detalhes dos participantes
    const collaborators = await prisma.attendee.findMany({
      where: { id: { in: attendeeIds } },
      select: { name: true, email: true }
    });

    // 2. Buscar o próximo evento LIVE
    const now = new Date();
    const nextEvent = await prisma.event.findFirst({
      where: {
        status: "LIVE",
        date: { gte: now }
      },
      orderBy: { date: 'asc' }
    });

    if (!nextEvent) {
      return NextResponse.json({ error: "Não há nenhum evento LIVE agendado para o futuro." }, { status: 404 });
    }

    // 3. Enviar convites
    const results = await Promise.all(collaborators.map(async (c: any) => {
      try {
        await sendEmail({
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
        return { success: true };
      } catch (e) {
        console.error(`Falha ao enviar convite para ${c.email}`, e);
        return { success: false };
      }
    }));

    const successCount = results.filter((r: any) => r.success).length;

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
