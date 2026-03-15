
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Start of today minus 6 hours to keep today's event active during the event time
    const today = new Date();
    today.setHours(today.getHours() - 6);

    // Find the nearest LIVE event that is today or in the future
    const event = await prisma.event.findFirst({
      where: {
        status: "LIVE",
        date: { gte: today }
      },
      include: {
        _count: {
          select: { attendees: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    if (!event) {
      return NextResponse.json({ event: null });
    }

    const totalAttendees = event._count.attendees;
    const occupancy = (totalAttendees / event.capacity) * 100;

    return NextResponse.json({
      event: {
        ...event,
        occupancy,
        isFull: occupancy >= 100
      }
    });

  } catch (error) {
    console.error("Active Event API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar evento ativo." }, { status: 500 });
  }
}
