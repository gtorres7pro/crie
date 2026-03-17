import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { memberId, amount, date, description } = body;

    if (!memberId || amount == null || !date) {
      return NextResponse.json({ error: "ID do membro, valor e data são obrigatórios." }, { status: 400 });
    }

    const newPayment = await prisma.memberPayment.create({
      data: {
        memberId,
        amount: parseFloat(amount),
        date: new Date(date),
        description
      }
    });

    return NextResponse.json(newPayment);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao registrar mensalidade.", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    await prisma.memberPayment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir mensalidade.", details: error.message }, { status: 500 });
  }
}
