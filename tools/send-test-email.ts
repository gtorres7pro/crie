
import { sendEmail } from "../src/lib/email";
import { getRegistrationEmailHtml } from "../src/lib/email-templates";

async function run() {
  const result = await sendEmail({
    to: "gtorreshbl@gmail.com",
    subject: "Teste: Novo Layout de Confirmação - CRIE Braga",
    html: getRegistrationEmailHtml({
      name: "Gabriel Torres",
      eventTitle: "CRIE Braga - Network Inaugural",
      eventDate: "16 de Março de 2026 às 19:30h",
      eventLocation: "Lagoinha Braga (Trav. Rua do Parque Comercial)",
      eventPrice: 6,
      bannerUrl: null
    })
  });

  console.log("Email Result:", result);
}

run().catch(console.error);
