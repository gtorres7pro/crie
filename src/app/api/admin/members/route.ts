import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");

    let whereClause: any = {};
    if (cityId && cityId !== "all") {
      whereClause.cityId = cityId;
    }

    if (role === "REGIONAL_LEADER") {
      whereClause.city = {
        OR: [
          { regionalLeaders: { some: { id: session.user.id } } },
          { users: { some: { id: session.user.id } } }
        ]
      };
    } else if (role !== "MASTER_ADMIN" && role !== "GLOBAL_LEADER") {
       whereClause.city = {
         users: { some: { id: session.user.id } }
       };
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        city: { select: { name: true } },
        payments: { orderBy: { date: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(members);
  } catch (error: any) {
    console.error("Members GET API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar membros.", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, company, industry, cityId } = body;

    if (!name || !email || !cityId) {
      return NextResponse.json({ error: "Campos obrigatórios: Nome, Email, Cidade" }, { status: 400 });
    }

    const newMember = await prisma.member.create({
      data: {
        name,
        email,
        phone: phone || "",
        company,
        industry,
        cityId,
        status: "Ativo"
      }
    });

    return NextResponse.json(newMember);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este email já está registrado como membro." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar membro.", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, email, phone, company, industry, status, cityId } = body;

    if (!id) {
       return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (company !== undefined) data.company = company;
    if (industry !== undefined) data.industry = industry;
    if (status) data.status = status;
    if (cityId) data.cityId = cityId;

    const updated = await prisma.member.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este email já está registado como membro." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar membro.", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER"].includes(role)) {
    return NextResponse.json({ error: "Apenas Master Admins ou Global Leaders podem excluir membros." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    await prisma.member.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir membro.", details: error.message }, { status: 500 });
  }
}
