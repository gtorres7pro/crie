
const brandColor = "#F59E0B";
const bgMain = "#0A0A0A";
const bgCard = "#111111";
const textPrimary = "#FFFFFF";
const textSecondary = "#A1A1AA";

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: ${bgMain}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background-color: ${bgCard}; border-radius: 24px; overflow: hidden; border: 1px solid #27272a; }
    .content { padding: 48px; }
    .footer { padding: 32px 48px; border-top: 1px solid #27272a; background-color: #0d0d0d; }
    .btn { display: inline-block; background-color: ${brandColor}; color: #000 !important; padding: 16px 32px; border-radius: 14px; font-weight: 900; text-decoration: none; margin: 20px 0; text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px; }
    .logo-box { width: 56px; height: 56px; background: linear-gradient(135deg, ${brandColor} 0%, #D97706 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; text-decoration: none; }
    .logo-text { color: #000; font-size: 28px; font-weight: 900; line-height: 1; }
    @media only screen and (max-width: 480px) { .content { padding: 24px; } }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 32px; height: 32px; background: ${brandColor}; border-radius: 8px; display: inline-block; text-align: center; line-height: 32px; font-weight: 900; color: #000;">C*</div>
        <span style="font-size: 16px; font-weight: 900; color: #fff;">CRIE Braga</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: ${textSecondary};">
        Siga-nos no Instagram: <a href="https://instagram.com/crielagoinhabraga" style="color: ${brandColor}; text-decoration: none; font-weight: 700;">@crielagoinhabraga</a>
      </p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 0.1em;">Business & Connection Movement • Lagoinha Global</p>
    </div>
  </div>
</body>
</html>
`;

export const getRegistrationEmailHtml = (data: {
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventPrice: number;
  bannerUrl?: string | null;
  paymentProofUrl?: string | null;
}) => {
  return baseLayout(`
    ${data.bannerUrl ? `<img src="${data.bannerUrl}" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #27272a;" alt="Banner" />` : ''}
    <div class="content">
      <div style="display: table; margin-bottom: 32px;">
        <div style="display: table-cell; vertical-align: middle;">
          <div class="logo-box"><span class="logo-text">C*</span></div>
        </div>
      </div>

      <h1 style="font-size: 32px; font-weight: 900; color: ${brandColor}; margin: 0 0 16px 0; letter-spacing: -0.02em;">Inscrição Confirmada!</h1>
      <p style="font-size: 18px; color: #fff; margin-bottom: 32px;">Olá <strong>${data.name}</strong>, o seu lugar está reservado.</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: ${textSecondary}; margin-bottom: 32px;">
        Estamos muito entusiasmados por tê-lo connosco no <strong>${data.eventTitle}</strong>. 
        Para oficializar a sua participação, por favor siga as instruções de pagamento abaixo.
      </p>
      
      <div style="background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border: 1px solid ${brandColor}; padding:32px; border-radius: 24px; margin-bottom: 32px;">
        <span style="font-size: 10px; font-weight: 900; color: ${brandColor}; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 16px; display: block;">Dados para Pagamento (${data.eventPrice}€)</span>
        
        <div style="margin-bottom: 24px;">
           <span style="font-size: 12px; color: ${textSecondary}; display: block; margin-bottom: 4px;">MB WAY</span>
           <span style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: 0.05em;">+351 918 704 170</span>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 24px;">
           <span style="font-size: 12px; color: ${textSecondary}; display: block; margin-bottom: 4px;">IBAN</span>
           <span style="font-size: 16px; font-weight: 700; color: #fff; font-family: monospace;">PT50 0018 0003 6715 5978 0205 5</span>
        </div>
      </div>

      <div style="background-color: #18181b; padding: 24px; border-radius: 20px; border: 1px solid #27272a; margin-bottom: 32px;">
        <span style="font-size: 10px; font-weight: 900; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: block;">⚠️ Confirmar Comprovativo</span>
        <p style="font-size: 14px; color: #fff; line-height: 1.6; margin: 0;">
          Por favor, envie o comprovativo de pagamento por <strong>WhatsApp</strong> para:
          <br/>
          <a href="https://wa.me/13214443034" style="color: ${brandColor}; text-decoration: none; font-weight: 800; font-size: 16px;">+1 321 444 3034</a>
          <br/>
          <span style="font-size: 12px; color: ${textSecondary};">Ou apresente-o digitalmente no dia do evento.</span>
        </p>
      </div>

      <div style="display: table; width: 100%; margin-bottom: 32px;">
        <div style="display: table-row;">
          <div style="display: table-cell; width: 50%; padding-right: 8px;">
            <div style="background-color: #18181b; padding: 20px; border-radius: 16px; border: 1px solid #27272a;">
              <span style="font-size: 10px; font-weight: 900; color: #71717a; text-transform: uppercase; margin-bottom: 4px; display: block;">Data</span>
              <span style="font-size: 14px; font-weight: 700; color: #fff;">${data.eventDate}</span>
            </div>
          </div>
          <div style="display: table-cell; width: 50%; padding-left: 8px;">
            <div style="background-color: #18181b; padding: 20px; border-radius: 16px; border: 1px solid #27272a;">
              <span style="font-size: 10px; font-weight: 900; color: #71717a; text-transform: uppercase; margin-bottom: 4px; display: block;">Local</span>
              <span style="font-size: 14px; font-weight: 700; color: #fff; line-height: 1.2;">${data.eventLocation.split('(')[0].trim()}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  `);
};

export const getWelcomeEmailHtml = (data: { name: string; email: string; dashboardUrl: string }) => {
  return baseLayout(`
    <div class="content">
      <div class="logo-box"><span class="logo-text">C*</span></div>
      <h1 style="font-size: 32px; font-weight: 900; color: ${brandColor}; margin: 0 0 24px 0; letter-spacing: -0.02em;">Bem-vindo, ${data.name}!</h1>
      <p style="font-size: 16px; line-height: 1.6; color: ${textSecondary};">Sua conta foi criada na plataforma de gestão do CRIE Braga.</p>
      
      <div style="background-color: #18181b; padding: 24px; border-radius: 16px; border: 1px solid #27272a; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 900;">Dados de Acesso</p>
        <p style="margin: 12px 0 0 0; color: #fff;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 4px 0 0 0; color: #fff;"><strong>Senha:</strong> A senha definida pelo administrador</p>
      </div>

      <a href="${data.dashboardUrl}" class="btn">Acessar Painel</a>
    </div>
  `);
};

export const getForgotPasswordEmailHtml = (data: { name: string; resetUrl: string }) => {
  return baseLayout(`
    <div class="content">
      <div class="logo-box"><span class="logo-text">C*</span></div>
      <h1 style="font-size: 32px; font-weight: 900; color: ${brandColor}; margin: 0 0 24px 0; letter-spacing: -0.02em;">Recuperar Senha</h1>
      <p style="font-size: 16px; line-height: 1.6; color: ${textSecondary};">Olá ${data.name}. Recebemos um pedido de redefinição de senha para sua conta.</p>
      <p style="font-size: 14px; color: ${textSecondary}; margin-top: 20px;">Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
      
      <a href="${data.resetUrl}" class="btn">Redefinir Senha</a>
      
      <p style="font-size: 12px; color: #52525b; margin-top: 32px;">Se não solicitou esta alteração, pode ignorar este email com segurança.</p>
    </div>
  `);
};
