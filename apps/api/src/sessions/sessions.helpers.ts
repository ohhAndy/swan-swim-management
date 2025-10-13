import type { Prisma } from "@prisma/client";
import { NOTFOUND } from "dns";

export async function countUsedSeatsForSession(
    tx: Prisma.TransactionClient,
    offeringId: string,
    date: Date
) {
    const session = await tx.classSession.findFirst({
        where: { offeringId, date },
        select: { id: true },
    });

    const expectedRegulars = await tx.enrollment.count({
        where: {
            offeringId,
            status: "active",
            enrollDate: {lte: date},
            OR: [{ endDate: null }, { endDate: { gte: date } }],
            ...(session
                ? {
                    enrollmentSkips: {
                        none: { classSessionId: session.id },
                    },
                    attendance: {
                        none: {
                            classSessionId: session.id,
                            status: "excused",
                        },
                    },
                }
            : {}),
        },
    });

    const makeUpCount = session 
        ? await tx.makeUpBooking.count({
            where: {
                classSessionId: session.id,
                status: { in: ["scheduled", "attended"] as any },
            },
          })
        : 0;

    return { expectedRegulars, makeUpCount, sessionId: session?.id ?? null };
}

export async function hasTimeConflict(
    tx: Prisma.TransactionClient,
    studentId: string,
    date: Date
) {
    const sameTimeSessions = await tx.classSession.findMany({
        where: { date },
        select: { id: true, offeringId: true },
    });

    if(sameTimeSessions.length === 0) return false;

    const sessionIds = sameTimeSessions.map((s) => s.id);
    const offeringIds = sameTimeSessions.map((s) => s.offeringId);

    const conflict = await tx.enrollment.count({
        where: {
            studentId,
            offeringId: { in: offeringIds },
            status: "active",
            enrollDate: { lte: date },
            OR: [{ endDate: null }, { endDate: { gte: date } }],
            enrollmentSkips: {
                none: {
                    classSessionId: { in: sessionIds },
                },
            },
        },
    });

    return conflict > 0;
}