import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const cityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    let whereClause = {};

    // Filtros baseados na role
    if (role === "LOCAL_LEADER") {
      // Local Leader vê membros das suas cidades
      const userCities = await (prisma as any).city.findMany({
        where: { users: { some: { id: session.user.id } } },
        select: { id: true }
      });
      const cityIds = userCities.map((c: any) => c.id);
      whereClause = { cities: { some: { id: { in: cityIds } } } };
    }
    else if (role === "REGIONAL_LEADER") {
       // Regional Leader vê membros das cidades que lidera
       const ledCities = await (prisma as any).city.findMany({
         where: { regionalLeaderId: session.user.id },
         select: { id: true }
       });
       const cityIds = ledCities.map((c: any) => c.id);
       whereClause = { cities: { some: { id: { in: cityIds } } } };
    }

    const users = await (prisma as any).user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        cities: { select: { id: true, name: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Users API Detailed Error:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
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
    // 1. MASTER_ADMIN: Pode tudo
    if (currentRole === "MASTER_ADMIN") {
      // Allow all roles
    }
    // 2. GLOBAL_LEADER: Global, Local, Apoiador (Não cria Master ou outros Globais se quisermos? O user disse Global cria Global)
    else if (currentRole === "GLOBAL_LEADER") {
      if (["MASTER_ADMIN"].includes(role)) {
         return NextResponse.json({ error: "Global Leader não pode criar Master Admin" }, { status: 403 });
      }
    }
    // 3. REGIONAL_LEADER: Local Leaders e Apoiadores apenas para suas cidades
    else if (currentRole === "REGIONAL_LEADER") {
       if (!["LOCAL_LEADER", "APOIADOR"].includes(role)) {
         return NextResponse.json({ error: "Regional Leader só pode criar Líderes Locais e Apoiadores" }, { status: 403 });
       }
       // Validar se as cidades pertencem ao Regional Leader
       const ledCities = await (prisma as any).city.findMany({
         where: { regionalLeaderId: currentUserId },
         select: { id: true }
       });
       const ledCityIds = ledCities.map((c: any) => c.id);
       const invalidCities = (cityIds || []).filter((id: string) => !ledCityIds.includes(id));
       if (invalidCities.length > 0) {
         return NextResponse.json({ error: "Você só pode atribuir usuários a cidades que você lidera regionalmente" }, { status: 403 });
       }
    }
    // 4. LOCAL_LEADER: Apoiadores apenas para sua cidade
    else if (currentRole === "LOCAL_LEADER") {
      if (role !== "APOIADOR") {
        return NextResponse.json({ error: "Líder Local só pode criar Apoiadores" }, { status: 403 });
      }
      // Validar se as cidades pertencem ao Local Leader
      const userCities = await (prisma as any).city.findMany({
        where: { users: { some: { id: currentUserId } } },
        select: { id: true }
      });
      const myCityIds = userCities.map((c: any) => c.id);
      const invalidCities = (cityIds || []).filter((id: string) => !myCityIds.includes(id));
      if (invalidCities.length > 0) {
        return NextResponse.json({ error: "Você só pode atribuir apoiadores às suas próprias cidades" }, { status: 403 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
    };

    if (cityIds && cityIds.length > 0) {
      userData.cities = {
        connect: cityIds.map((id: string) => ({ id }))
      };
    }

    const user = await (prisma as any).user.create({
      data: userData
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }
    console.error("Create User Error:", error);
    return NextResponse.json({ 
      error: "Erro ao criar usuário", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const currentRole = session?.user?.role as string;
  const currentUserId = session?.user?.id as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(currentRole)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id, name, email, phone, role, cityIds } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }

    // 1. Hierarquia de Edição
    if (currentRole !== "MASTER_ADMIN") {
       const targetUser = await (prisma as any).user.findUnique({
         where: { id },
         select: { role: true }
       });

       if (!targetUser) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

       // Não pode editar alguém de nível superior ou igual (exceto Master)
       const roleHierarchy = ["APOIADOR", "LOCAL_LEADER", "REGIONAL_LEADER", "GLOBAL_LEADER", "MASTER_ADMIN"];
       if (roleHierarchy.indexOf(targetUser.role) >= roleHierarchy.indexOf(currentRole)) {
          return NextResponse.json({ error: "Você não tem permissão para editar este usuário" }, { status: 403 });
       }
    }

    // 2. Validação de Cidades (Regional/Local)
    if (cityIds && currentRole !== "MASTER_ADMIN" && currentRole !== "GLOBAL_LEADER") {
       const ledCityIds = (await (prisma as any).city.findMany({
         where: currentRole === "REGIONAL_LEADER" ? { regionalLeaderId: currentUserId } : { users: { some: { id: currentUserId } } },
         select: { id: true }
       })).map((c: any) => c.id);

       const invalidCities = cityIds.filter((cid: string) => !ledCityIds.includes(cid));
       if (invalidCities.length > 0) {
         return NextResponse.json({ error: "Permissão negada para uma ou mais cidades" }, { status: 403 });
       }
    }

    const updateData: any = {
      ...(name && { name }),
      ...(email && { email: email.toLowerCase() }),
      ...(phone && { phone }),
      ...(role && { role }),
    };

    if (cityIds) {
      updateData.cities = {
        set: cityIds.map((cid: string) => ({ id: cid }))
      };
    }

    const updated = await (prisma as any).user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cities: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}

