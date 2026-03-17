
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

    // Styles Common
    const mainColor = "#f59e0b"; // Amber 500
    const bgColor = "#0a0a0a";
    const cardBg = "#ffffff";
    const textColor = "#1f2937";

    // 3. Email para o Admin
    const attachmentsHtml = attachments ? `
      <div style="margin-top: 25px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="margin: 0 0 12px 0; color: ${textColor}; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📁 Arquivos Anexados</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${attachments.split(',').filter((u: string) => u.trim() !== '').map((url: string) => `
            <a href="${url.trim()}" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">
              • Visualizar Anexo →
            </a>
          `).join('')}
        </div>
      </div>
    ` : '';

    await sendEmail({
      to: adminEmail,
      subject: `[LOG SISTEMA] Nova Solicitação: ${subject}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: ${cardBg}; border-radius: 24px; overflow: hidden; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: ${bgColor}; padding: 32px; text-align: center;">
              <div style="display: inline-block; background-color: ${mainColor}; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: 900; font-size: 18px; margin-bottom: 12px;">CRIE</div>
              <h2 style="color: #fff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Gestão Técnica</h2>
            </div>
            <div style="padding: 40px;">
              <p style="color: ${textColor}; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Uma nova solicitação foi registrada no painel administrativo.</p>
              
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Solicitante</p>
                <p style="margin: 0; font-size: 15px; color: ${textColor}; font-weight: 600;">${user?.name} (${user?.email})</p>
              </div>

              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Assunto & Categoria</p>
                <p style="margin: 0; font-size: 15px; color: ${textColor}; font-weight: 600;">[${type}] ${subject}</p>
              </div>

              <div style="background-color: #fffbeb; border-left: 4px solid ${mainColor}; padding: 24px; border-radius: 0 12px 12px 0;">
                <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 800; color: ${mainColor}; text-transform: uppercase;">Mensagem</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${textColor};">${message.replace(/\n/g, '<br/>')}</p>
              </div>

              ${attachmentsHtml}

              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">ID de Protocolo: ${feedback.id}</p>
              </div>
            </div>
          </div>
        </div>
      `
    });

    // 4. Email de confirmação para o usuário
    await sendEmail({
      to: user?.email as string,
      subject: `Recebemos sua mensagem: ${subject}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: ${cardBg}; border-radius: 24px; overflow: hidden; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: ${bgColor}; padding: 32px; text-align: center;">
              <div style="display: inline-block; background-color: ${mainColor}; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: 900; font-size: 18px; margin-bottom: 12px;">CRIE</div>
              <h2 style="color: #fff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Solicitação Recebida</h2>
            </div>
            <div style="padding: 40px;">
              <h3 style="color: ${textColor}; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">Olá, ${user?.name}!</h3>
              <p style="color: ${textColor}; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Sua mensagem foi enviada com sucesso para nossa <strong>Equipe Técnica</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Resumo do seu pedido</p>
                <p style="margin: 0; font-size: 16px; color: ${textColor}; font-weight: 600; font-style: italic;">"${subject}"</p>
              </div>

              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">Estamos analisando os detalhes e entraremos em contato se precisarmos de mais informações para concluir o seu ajuste ou sugestão.</p>

              <div style="padding: 24px; border-radius: 16px; background-color: #fffbeb; text-align: center;">
                <p style="margin: 0; color: ${mainColor}; font-weight: 800; font-size: 14px;">Obrigado por contribuir para o crescimento da nossa plataforma!</p>
              </div>

              <div style="margin-top: 40px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 600;">Equipe de Desenvolvimento CRIE</p>
                <div style="width: 40px; height: 2px; background-color: ${mainColor}; margin: 12px auto;"></div>
              </div>
            </div>
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error: any) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Erro ao processar feedback.", details: error.message }, { status: 500 });
  }
}
