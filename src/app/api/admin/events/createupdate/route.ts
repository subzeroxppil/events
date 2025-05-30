import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      country,
      location,
      eventStartTime,
      eventEndTime,
      hasLuckyDraw,
      groupingStrategy,
      groupConfigNumber,
      prizes,
    } = body;

    if (!name || !country || !location || !eventStartTime || !eventEndTime) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const createdEvent = await prisma.event.create({
      data: {
        name,
        country,
        location,
        eventStartTime: new Date(eventStartTime),
        eventEndTime: new Date(eventEndTime),
        hasLuckyDraw,
        groupingStrategy:
          groupingStrategy === "noNeed" ? null : groupingStrategy,
        groupConfigNumber,
        createdBy: user.email,
      },
    });

    if (hasLuckyDraw && prizes?.length > 0) {
      for (const prize of prizes) {
        const existingBrand = await prisma.brand.upsert({
          where: { name: prize.brand },
          update: {},
          create: { name: prize.brand },
        });

        await prisma.prize.create({
          data: {
            name: prize.name,
            quantity: prize.quantity,
            imageBlob: Buffer.from(prize.imageBlob),
            brandId: existingBrand.id,
            eventId: createdEvent.id,
          },
        });
      }
    }

    return NextResponse.json({ message: "Event created successfully." });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
