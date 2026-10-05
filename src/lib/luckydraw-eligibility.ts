import { prisma } from "@/lib/prisma";

/**
 * Where a would-be winner stands in a draw, judged from the database rather
 * than any one admin screen's copy of the winners list.
 *
 * `blocked` is the only case that matters to callers: this person has already
 * won while someone else in the draw still hasn't. Once everyone has won a
 * repeat is expected (more spins than people), so it is not blocked.
 */
export async function winnerStanding(
  luckydrawId: number,
  workId: string
): Promise<{ alreadyWon: boolean; blocked: boolean }> {
  const rows = await prisma.events_portal_luckydraw_winners.findMany({
    where: { luckydrawId },
    select: { userId: true, events_portal_user: { select: { workId: true } } },
  });

  const alreadyWon = rows.some((row) => row.events_portal_user.workId === workId);
  if (!alreadyWon) return { alreadyWon, blocked: false };

  const luckyDraw = await prisma.events_portal_luckydraw.findUnique({
    where: { id: luckydrawId },
    select: { eventIds: true },
  });
  if (!luckyDraw) return { alreadyWon, blocked: false };

  const stillEligible = await prisma.events_portal_attendance.findFirst({
    where: {
      eventId: { in: luckyDraw.eventIds },
      userId: { notIn: rows.map((row) => row.userId) },
    },
    select: { id: true },
  });

  return { alreadyWon, blocked: stillEligible !== null };
}
