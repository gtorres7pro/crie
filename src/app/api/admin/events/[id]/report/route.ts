import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null as any;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Fetch event details with stats
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: true,
        finances: true,
        city: {
          include: {
            users: true,
            regionalLeaders: true
          }
        }
      }
    });

    if (!event) throw new Error("Evento não encontrado");

    const members = await prisma.member.findMany({ select: { email: true } });
    const memberEmails = new Set(members.map(m => m.email.toLowerCase()));
    const attendees = event.attendees || [];

    const totalInscritos = attendees.length;
    const presentes = attendees.filter((a: any) => a.presenceStatus === "Presente").length;
    const faltaram = totalInscritos - presentes;

    const pagos = attendees.filter((a: any) => a.paymentStatus === "Pago").length;
    const gratuitos = attendees.filter((a: any) => a.paymentStatus === "Gratuito").length;
    const pendentes = attendees.filter((a: any) => a.paymentStatus === "Pendente").length;

    const membrosCount = attendees.filter((a: any) => memberEmails.has(a.email.toLowerCase())).length;
    const convidadosArr = attendees.filter((a: any) => !memberEmails.has(a.email.toLowerCase()));
    const convidadosCount = convidadosArr.length;

    const guestEmails = convidadosArr.map((a: any) => a.email);
    const pastPresences = await prisma.attendee.findMany({
      where: { email: { in: guestEmails }, presenceStatus: "Presente", eventId: { not: id } },
      select: { email: true }
    });
    const recurrentEmails = new Set(pastPresences.map(p => p.email.toLowerCase()));
    const recorrentesCount = convidadosArr.filter((a: any) => recurrentEmails.has(a.email.toLowerCase())).length;
    const primeiraVezCount = convidadosCount - recorrentesCount;

    const salesRevenue = pagos * (event.price || 0);
    const manualRevenue = event.finances?.filter((f: any) => f.type === "Receita").reduce((acc: number, f: any) => acc + f.amount, 0) || 0;
    const manualExpenses = event.finances?.filter((f: any) => f.type === "Despesa").reduce((acc: number, f: any) => acc + f.amount, 0) || 0;
    const receitas = salesRevenue + manualRevenue;
    const despesas = manualExpenses;
    const saldo = receitas - despesas;

    // Setup Email Recipients
    const fromEmail = "donotreply@7pro.tech";
    const replyToEmail = "gtorreshbl@gmail.com";
    
    // Admins and Local/Regional leaders for the event's city
    const leadersEmails = new Set<string>();

    if (event.city) {
       event.city.users.forEach(u => {
         // Filter out the technical contact and ensure authorized roles
         if (u.email !== "contato@7pro.tech" && (u.role === "LOCAL_LEADER" || u.role === "GLOBAL_LEADER" || u.role === "MASTER_ADMIN")) {
            leadersEmails.add(u.email);
         }
       });
       event.city.regionalLeaders.forEach(u => {
         if (u.email !== "contato@7pro.tech") {
            leadersEmails.add(u.email);
         }
       });
    }

    const bccList = Array.from(leadersEmails);

    // Send Email
    if (resend) {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `CRIE | Gestão <${fromEmail}>`,
        to: ["gtorreshbl@gmail.com"], // Primary recipient
        bcc: bccList,
        reply_to: replyToEmail,
        subject: `📈 Relatório Financeiro: ${event.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; color: #000; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
                .content { padding: 40px 30px; }
                .event-info { margin-bottom: 30px; }
                .event-info p { margin: 5px 0; color: #71717a; font-size: 14px; text-transform: uppercase; font-weight: bold; }
                .stats-grid { display: table; width: 100%; border-spacing: 15px; margin: 0 -15px 30px -15px; }
                .stat-card { background-color: #111111; border: 1px solid #1f1f1f; padding: 20px; border-radius: 16px; display: table-cell; width: 50%; }
                .stat-label { font-size: 10px; color: #52525b; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                .stat-value { font-size: 18px; font-weight: 800; color: #ffffff; }
                .balance-section { background-color: #111111; border-left: 4px solid #f59e0b; padding: 25px; border-radius: 16px; margin-bottom: 40px; }
                .balance-label { font-size: 12px; color: #f59e0b; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
                .balance-value { font-size: 32px; font-weight: 900; color: #ffffff; }
                .section-title { font-size: 12px; font-weight: 900; color: #52525b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px; }
                .finance-item { padding: 12px 0; border-bottom: 1px solid #1a1a1a; }
                .finance-desc { font-size: 14px; font-weight: 600; color: #e4e4e7; margin: 0; }
                .finance-notes { font-size: 12px; color: #71717a; margin: 2px 0 0 0; }
                .footer { padding: 30px; text-align: center; border-top: 1px solid #1a1a1a; }
                .footer p { font-size: 11px; color: #3f3f46; margin: 0; text-transform: uppercase; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Relatório de Fechamento</h1>
                </div>
                <div class="content">
                  <div class="event-info">
                    <p style="color: #f59e0b; font-size: 18px; margin-bottom: 10px; text-transform: none;">${event.title}</p>
                    <p>📅 ${new Date(event.date).toLocaleDateString('pt-BR')}</p>
                    <p>📍 ${event.location} • ${event.city?.name || 'CRIE'}</p>
                  </div>

                  <div class="balance-section">
                    <div class="balance-label">Resultado Final (ROI)</div>
                    <div class="balance-value">${saldo.toFixed(2)}€</div>
                    <div style="margin-top: 10px; font-size: 11px; color: #71717a;"> RECEITAS: ${receitas.toFixed(2)}€ | DESPESAS: ${despesas.toFixed(2)}€</div>
                  </div>

                  <div class="section-title">Performance de Público</div>
                  <table style="width: 100%; margin-bottom: 20px; border-spacing: 0 10px;">
                    <tr>
                      <td style="width: 33%; padding: 0 5px;">
                        <div class="stat-card">
                          <div class="stat-label">Total Inscritos</div>
                          <div class="stat-value">${totalInscritos}</div>
                        </div>
                      </td>
                      <td style="width: 33%; padding: 0 5px;">
                        <div class="stat-card">
                          <div class="stat-label">Presentes</div>
                          <div class="stat-value" style="color: #10b981;">${presentes}</div>
                        </div>
                      </td>
                      <td style="width: 33%; padding: 0 5px;">
                        <div class="stat-card">
                          <div class="stat-label">Ausentes</div>
                          <div class="stat-value" style="color: #ef4444;">${faltaram}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 33%; padding: 0 5px;">
                        <div class="stat-card">
                          <div class="stat-label">Pagos</div>
                          <div class="stat-value">${pagos}</div>
                        </div>
                      </td>
                      <td style="width: 33%; padding: 0 5px;">
                        <div class="stat-card">
                          <div class="stat-label">Gratuitos</div>
                          <div class="stat-value" style="color: #3b82f6;">${gratuitos}</div>
                        </div>
                      </td>
                      <td style="width: 33%; padding: 0 5px;">
                        <div class="stat-card">
                          <div class="stat-label">Pendentes</div>
                          <div class="stat-value" style="color: #f59e0b;">${pendentes}</div>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <div class="section-title">Perfil dos Participantes</div>
                  <div class="stats-grid" style="margin-bottom: 20px;">
                    <div class="stat-card">
                      <div class="stat-label">💼 Membros</div>
                      <div class="stat-value">${membrosCount}</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-label">👋 Convidados</div>
                      <div class="stat-value">${convidadosCount}</div>
                    </div>
                  </div>

                  <div class="section-title">Fidelidade (Convidados)</div>
                  <div class="stats-grid" style="margin-bottom: 30px;">
                    <div class="stat-card">
                      <div class="stat-label">🆕 Primeira Vez</div>
                      <div class="stat-value" style="color: #f59e0b;">${primeiraVezCount}</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-label">🔄 Já Participaram</div>
                      <div class="stat-value">${recorrentesCount}</div>
                    </div>
                  </div>

                  <div class="section-title">Extrato Financeiro</div>
                  <div style="margin-bottom: 10px; padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                     <table style="width: 100%;">
                        <tr>
                           <td>
                              <p class="finance-desc">Venda de Inscrições</p>
                              <p class="finance-notes">Calculado sobre ${pagos} pagantes</p>
                           </td>
                           <td style="text-align: right; vertical-align: middle;">
                              <span style="color: #10b981; font-weight: 800; font-size: 14px;">+${salesRevenue.toFixed(2)}€</span>
                           </td>
                        </tr>
                     </table>
                  </div>
                  
                  ${manualRevenue > 0 ? `
                  <div style="margin-bottom: 10px; padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                     <table style="width: 100%;">
                        <tr>
                           <td>
                              <p class="finance-desc">Outras Receitas</p>
                              <p class="finance-notes">Lançamentos manuais</p>
                           </td>
                           <td style="text-align: right; vertical-align: middle;">
                              <span style="color: #10b981; font-weight: 800; font-size: 14px;">+${manualRevenue.toFixed(2)}€</span>
                           </td>
                        </tr>
                     </table>
                  </div>
                  ` : ''}

                  ${event.finances?.map((f: any) => `
                    <div style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                       <table style="width: 100%;">
                          <tr>
                             <td>
                                <p class="finance-desc">${f.description}</p>
                                ${f.notes ? `<p class="finance-notes">${f.notes}</p>` : ""}
                             </td>
                             <td style="text-align: right; vertical-align: middle;">
                                <span style="color: ${f.type === 'Receita' ? '#10b981' : '#ef4444'}; font-weight: 800; font-size: 14px;">
                                   ${f.type === 'Receita' ? '+' : '-'}${f.amount.toFixed(2)}€
                                </span>
                             </td>
                          </tr>
                       </table>
                    </div>
                  `).join('') || '<p style="color: #52525b; font-size: 12px; font-style: italic;">Nenhuma despesa manual registrada.</p>'}
                </div>
                <div class="footer">
                  <p>Relatório Interno • Gerado em ${new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) throw emailError;
    }

    // Lock the event
    await prisma.event.update({
      where: { id },
      data: { financialLocked: true, reportSentAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Report Email Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao enviar relatório." }, { status: 500 });
  }
}
