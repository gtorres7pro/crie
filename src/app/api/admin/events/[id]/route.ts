import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updateData: any = { ...body };
    
    // Type conversions for numeric fields coming from form bodies
    if (updateData.capacity !== undefined) updateData.capacity = Number(updateData.capacity);
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.date) updateData.date = new Date(updateData.date);

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Update Event Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar evento." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Event Error:", error);
    return NextResponse.json({ error: "Erro ao eliminar evento." }, { status: 500 });
  }
}
