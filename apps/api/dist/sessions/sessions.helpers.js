"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUsedSeatsForSession = countUsedSeatsForSession;
exports.hasTimeConflict = hasTimeConflict;
async function countUsedSeatsForSession(tx, offeringId, date) {
    const session = await tx.classSession.findFirst({
        where: { offeringId, date },
        select: { id: true },
    });
    const expectedRegulars = await tx.enrollment.count({
        where: {
            offeringId,
            status: "active",
            enrollDate: { lte: date },
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
                status: { in: ["scheduled", "attended"] },
            },
        })
        : 0;
    return { expectedRegulars, makeUpCount, sessionId: session?.id ?? null };
}
async function hasTimeConflict(tx, studentId, date) {
    const sameTimeSessions = await tx.classSession.findMany({
        where: { date },
        select: { id: true, offeringId: true },
    });
    if (sameTimeSessions.length === 0)
        return false;
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
