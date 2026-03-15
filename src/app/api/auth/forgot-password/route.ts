import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getForgotPasswordEmailHtml } from "@/lib/email-templates";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      // Por segurança, não confirmamos se o email existe ou não
      return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetExpires: expires
      }
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Recuperação de Senha - CRIE Braga",
      html: getForgotPasswordEmailHtml({
        name: user.name,
        resetUrl
      })
    });

    return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
