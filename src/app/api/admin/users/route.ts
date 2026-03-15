
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { getWelcomeEmailHtml } from "@/lib/email-templates";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    // Definir filtros baseados na role
    let where: any = {};
    
    if (role === "LOCAL_LEADER") {
      // Usuários que pertencem às mesmas cidades que o Líder Local
      const userWithCities = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { cities: { select: { id: true } } }
      });
      const cityIds = userWithCities?.cities.map(c => c.id) || [];
      where = {
        cities: {
          some: {
            id: { in: cityIds }
          }
        }
      };
    } else if (role === "REGIONAL_LEADER") {
      // Usuários nas cidades que o líder regional lidera
      const ledCities = await prisma.city.findMany({
        where: { regionalLeaderId: session.user.id },
        select: { id: true }
      });
      const cityIds = ledCities.map(c => c.id);
      where = {
        cities: {
          some: {
            id: { in: cityIds }
          }
        }
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        cities: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Users API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentRole = session?.user?.role;
  const currentUserId = session?.user?.id;
  
  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(currentRole as string)) {
    return NextResponse.json({ error: "Não autorizado para criar usuários" }, { status: 403 });
  }

  try {
    const { name, email, phone, password, role, cityIds } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Regras de Hierarquia
    if (currentRole === "MASTER_ADMIN") {
      // Permite tudo
    } else if (currentRole === "GLOBAL_LEADER") {
      if (role === "MASTER_ADMIN") return NextResponse.json({ error: "Não permitido" }, { status: 403 });
    } else if (currentRole === "REGIONAL_LEADER") {
       if (!["LOCAL_LEADER", "APOIADOR"].includes(role)) {
         return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
       }
    } else if (currentRole === "LOCAL_LEADER") {
      if (role !== "APOIADOR") return NextResponse.json({ error: "Apenas Apoiadores" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role,
        cities: cityIds && cityIds.length > 0 ? {
          connect: cityIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    // Enviar Email de Boas-vindas
    try {
      await sendEmail({
        to: email,
        subject: "Bem-vindo ao CRIE Braga!",
        html: getWelcomeEmailHtml({
          name,
          email,
          dashboardUrl: `${process.env.NEXTAUTH_URL}/auth/signin`
        })
      });
    } catch (e) {
      console.error("Boas-vindas: Falha ao enviar email", e);
    }

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    console.error("Create User Error:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar usuário", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const currentRole = session?.user?.role as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(currentRole)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id, name, email, phone, role, cityIds, password } = await req.json();
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    // Hierarquia básica
    if (currentRole !== "MASTER_ADMIN") {
       const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
       if (!targetUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
       
       const roles = ["APOIADOR", "LOCAL_LEADER", "REGIONAL_LEADER", "GLOBAL_LEADER", "MASTER_ADMIN"];
       if (roles.indexOf(targetUser.role) >= roles.indexOf(currentRole)) {
          return NextResponse.json({ error: "Sem permissão para alterar este nível" }, { status: 403 });
       }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    
    if (cityIds) {
      updateData.cities = {
        set: cityIds.map((cid: string) => ({ id: cid }))
      };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        cities: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar usuário", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  try {
    // Primeiro desconectar de cidades para evitar erros de FK
    await prisma.user.update({
      where: { id },
      data: {
        cities: { set: [] },
        ledCities: { set: [] }
      }
    });

    // Remover logs de auditoria se houver
    await prisma.auditLog.deleteMany({ where: { userId: id } });

    // Excluir definitivamente
    await prisma.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: "Erro ao excluir usuário", details: error.message }, { status: 500 });
  }
}
