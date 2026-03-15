import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null as any;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    if (!resend) {
      console.warn('RESEND_API_KEY não configurada. Simulando envio de email.');
      return { success: true, simulated: true };
    }

    const { data, error } = await resend.emails.send({
      from: `CRIE Braga <${process.env.OFFICIAL_EMAIL || 'onboarding@resend.dev'}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado no envio de email:', error);
    return { success: false, error };
  }
}
