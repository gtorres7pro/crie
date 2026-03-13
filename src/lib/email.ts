import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data, error } = await resend.emails.send({
      from: `CRIE Braga <${process.env.OFFICIAL_EMAIL || 'onboarding@resend.dev'}>`, // Remetente dinâmico
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
