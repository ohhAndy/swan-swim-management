"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSessionSummary = toSessionSummary;
exports.toAttendanceMark = toAttendanceMark;
exports.toRosterRow = toRosterRow;
const serializers_1 = require("../utils/serializers");
function toSessionSummary(session) {
    return {
        id: session.id,
        date: (0, serializers_1.d2iso)(session.date),
        offeringId: session.offeringId,
        offeringTitle: session.offering?.title ?? null,
        startTime: session.offering?.startTime ?? null,
        endTime: session.offering?.endTime ?? null,
        capacity: session.offering?.capacity ?? 0,
        term: session.offering?.term
            ? {
                id: session.offering.term.id,
                name: session.offering.term.name,
            }
            : null,
    };
}
function toAttendanceMark(a) {
    if (!a)
        return null;
    return {
        id: (a.id),
        status: a.status,
        notes: a.notes ?? null,
        markedAt: (0, serializers_1.d2iso)(a.markedAt),
    };
}
function toRosterRow(e, sessionId) {
    const mark = e.attendance.find(a => a.classSessionId === sessionId) ?? null;
    return {
        enrollmentId: (e.id),
        notes: e.notes ?? "",
        studentId: (e.studentId),
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        shortCode: e.student.shortCode ?? null,
        studentLevel: e.student.level ?? "",
        studentBirthDate: e.student.birthdate?.toDateString() ?? null,
        attendance: toAttendanceMark(mark),
        skippedSessionIds: e.enrollmentSkips.map(skip => skip.classSessionId),
    };
}
