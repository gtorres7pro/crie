
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(user?.role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { type, subject, message, attachments } = await req.json();

    if (!subject || !message) {
       return NextResponse.json({ error: "Assunto e mensagem são obrigatórios" }, { status: 400 });
    }

    // 1. Salvar no banco
    const feedback = await prisma.feedback.create({
      data: {
        userName: user?.name as string,
        userEmail: user?.email as string,
        type,
        subject,
        message,
        attachments,
        status: "PENDING"
      }
    });

    // 2. Buscar email do Master Admin
    const masterAdmin = await prisma.user.findFirst({
        where: { role: "MASTER_ADMIN" },
        select: { email: true }
    });

    const adminEmail = masterAdmin?.email || "gtorreshbl@gmail.com";

    // 3. Email para o Admin
    const attachmentsHtml = attachments ? `
      <div style="margin-top: 20px; padding: 15px; background: #f4f4f5; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px;">Anexos:</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${attachments.split(',').map((url: string) => `<li><a href="${url.trim()}" target="_blank">Clique aqui para ver o arquivo</a></li>`).join('')}
        </ul>
      </div>
    ` : '';

    await sendEmail({
      to: adminEmail,
      subject: `[Feedback Sistema] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #18181b;">
          <h2 style="color: #f59e0b;">Nova Solicitação de Ajuste / Feedback</h2>
          <p><strong>De:</strong> ${user?.name} (${user?.email})</p>
          <p><strong>Tipo:</strong> ${type}</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <div style="margin: 20px 0; padding: 20px; border-left: 4px solid #f59e0b; background: #fffcf0;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
          ${attachmentsHtml}
          <p style="font-size: 12px; color: #71717a; margin-top: 30px;">ID do Registro: ${feedback.id}</p>
        </div>
      `
    });

    // 4. Email de confirmação para o usuário
    await sendEmail({
      to: user?.email as string,
      subject: `Recebemos sua solicitação: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #18181b;">
          <h2 style="color: #f59e0b;">Olá, ${user?.name}!</h2>
          <p>Recebemos sua mensagem em nosso portal de administração.</p>
          <p>Nossa equipe técnica (Master Admin) foi notificada e analisará sua solicitação o mais breve possível.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
             <p style="margin: 0;"><strong>Seu resumo:</strong></p>
             <p style="font-style: italic; color: #52525b;">"${subject}"</p>
          </div>
          <p>Obrigado por nos ajudar a melhorar o sistema CRIE Braga!</p>
          <p style="font-size: 12px; color: #71717a; margin-top: 30px;">Equipe de Desenvolvimento</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error: any) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Erro ao processar feedback." }, { status: 500 });
  }
}
