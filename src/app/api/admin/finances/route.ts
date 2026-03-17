import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const bodyText = await req.text();
    import('fs').then(fs => fs.appendFileSync('finance_log.txt', new Date().toISOString() + ' : ' + bodyText + '\n'));
    const body = JSON.parse(bodyText);
    const { eventId, amount, description, notes, receiptUrl, type } = body;

    if (!eventId || !amount || !description || !type) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Check if event is locked
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { financialLocked: true }
    });

    if (event?.financialLocked) {
      return NextResponse.json({ error: "Este evento está com o financeiro fechado." }, { status: 400 });
    }

    const numericAmount = typeof amount === "string" ? parseFloat(amount.replace(',', '.')) : Number(amount);

    const finance = await prisma.finance.create({
      data: {
        eventId,
        amount: Math.abs(numericAmount),
        description,
        notes,
        receiptUrl,
        type
      }
    });

    return NextResponse.json(finance);
  } catch (error: any) {
    console.error("Finance Create Error Detailed:", error);
    return NextResponse.json({ error: "Erro ao adicionar lançamento.", details: error.message + " - " + String(error) }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id, amount, description, type, receiptUrl } = await req.json();

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const finance = await prisma.finance.findUnique({
      where: { id },
      select: { eventId: true }
    });

    if (!finance) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });

    const event = await prisma.event.findUnique({
      where: { id: finance.eventId },
      select: { financialLocked: true }
    });

    if (event?.financialLocked) {
      return NextResponse.json({ error: "Financeiro fechado." }, { status: 400 });
    }

    const numericAmount = typeof amount === "string" ? parseFloat(amount.replace(',', '.')) : Number(amount);

    const updated = await prisma.finance.update({
      where: { id },
      data: {
        amount: Math.abs(numericAmount),
        description,
        type,
        receiptUrl
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Finance Update Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar lançamento.", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const finance = await prisma.finance.findUnique({
      where: { id },
      select: { eventId: true }
    });

    if (!finance) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });

    const event = await prisma.event.findUnique({
      where: { id: finance.eventId },
      select: { financialLocked: true }
    });

    if (event?.financialLocked) {
      return NextResponse.json({ error: "Não é possível apagar lançamentos de um evento fechado." }, { status: 400 });
    }

    await prisma.finance.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Finance Delete Error:", error);
    return NextResponse.json({ error: "Erro ao eliminar lançamento.", details: error.message }, { status: 500 });
  }
}
