"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUsedSeatsForSession = countUsedSeatsForSession;
exports.hasTimeConflict = hasTimeConflict;
const capacity_utils_1 = require("../common/capacity.utils");
async function countUsedSeatsForSession(tx, offeringId, date) {
    const session = await tx.classSession.findFirst({
        where: { offeringId, date },
        select: { id: true },
    });
    // Get Offering details for dynamic capacity
    const offering = await tx.classOffering.findUnique({
        where: { id: offeringId },
        select: { capacity: true, instructors: { where: { removedAt: null } } },
    });
    const enrollments = await tx.enrollment.findMany({
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
        select: { classRatio: true },
    });
    const makeups = session
        ? await tx.makeUpBooking.findMany({
            where: {
                classSessionId: session.id,
                status: { in: ["scheduled", "attended"] },
            },
            select: { id: true },
        })
        : [];
    const { filled, effectiveCapacity, openSeats } = (0, capacity_utils_1.calculateClassUsage)([...enrollments, ...makeups.map(() => ({ classRatio: "3:1" }))], offering?.instructors.length ?? 0, offering?.capacity ?? 0);
    return {
        filled,
        effectiveCapacity,
        openSeats,
        sessionId: session?.id ?? null,
    };
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
