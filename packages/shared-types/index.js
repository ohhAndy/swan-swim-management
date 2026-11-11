"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEnrollmentTuition = exports.getRatioRate = exports.CLASS_RATIO_RATES = exports.calculateClassUsage = exports.getRatioWeight = exports.CLASS_RATIO_WEIGHTS = void 0;

exports.CLASS_RATIO_WEIGHTS = {
  "1:1": 3.0,
  "2:1": 1.5,
  "3:1": 1.0,
};

function getRatioWeight(ratio) {
  if (!ratio) return 1.0;
  return exports.CLASS_RATIO_WEIGHTS[ratio] ?? 1.0;
}
exports.getRatioWeight = getRatioWeight;

function calculateClassUsage(enrollments, instructorCount, baseCapacity) {
  var filled = 0;

  for (var i = 0; i < enrollments.length; i++) {
    var enr = enrollments[i];
    var ratio = enr ? enr.classRatio : null;
    filled += getRatioWeight(ratio);
  }

  var dynamicMin = instructorCount >= 2 ? 5 : 0;
  var effectiveCapacity = Math.max(baseCapacity, dynamicMin);
  var openSeats = Math.max(0, Math.floor(effectiveCapacity - filled));

  return {
    filled: filled,
    effectiveCapacity: effectiveCapacity,
    openSeats: openSeats,
  };
}
exports.calculateClassUsage = calculateClassUsage;

exports.CLASS_RATIO_RATES = {
  "3:1": 50,
  "2:1": 73,
  "1:1": 140,
};

function getRatioRate(ratio) {
  if (!ratio) return 50;
  return exports.CLASS_RATIO_RATES[ratio] ?? 50;
}
exports.getRatioRate = getRatioRate;

function calculateEnrollmentTuition(ratio, totalSessions, skippedSessions) {
  var rate = getRatioRate(ratio);
  var total = totalSessions || 0;
  var skipped = skippedSessions || 0;
  var attending = Math.max(0, total - skipped);
  return rate * attending;
}
exports.calculateEnrollmentTuition = calculateEnrollmentTuition;

// ---------------------------------------------------------------------------
// Swim team: tiers, season fees and installment plans
// All dates are UTC calendar dates in "YYYY-MM-DD" form.
// ---------------------------------------------------------------------------

exports.SWIM_TEAM_FREQUENCIES = [1, 2, 3, 4];

exports.DEFAULT_SWIM_TEAM_MEET_FEES = { 1: 0, 2: 100, 3: 425, 4: 425 };

function toCents(amount) {
  return Math.round((Number(amount) || 0) * 100);
}

function ymd(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function monthIndex(value) {
  var s = ymd(value);
  return Number(s.slice(0, 4)) * 12 + (Number(s.slice(5, 7)) - 1);
}

function countSeasonMonths(seasonStart, seasonEnd) {
  return Math.max(1, monthIndex(seasonEnd) - monthIndex(seasonStart) + 1);
}
exports.countSeasonMonths = countSeasonMonths;

function calculateSwimTeamFees(tier, competing, seasonStart, seasonEnd, joinDate) {
  var totalMonths = countSeasonMonths(seasonStart, seasonEnd);
  var joinIdx = Math.max(monthIndex(joinDate || seasonStart), monthIndex(seasonStart));
  var remaining = Math.min(
    totalMonths,
    Math.max(0, monthIndex(seasonEnd) - joinIdx + 1)
  );
  var practiceCents = Math.round((toCents(tier.practiceFee) * remaining) / totalMonths);
  return {
    practiceFee: practiceCents / 100,
    meetFee: competing ? toCents(tier.meetFee) / 100 : 0,
    monthsRemaining: remaining,
    seasonMonths: totalMonths,
  };
}
exports.calculateSwimTeamFees = calculateSwimTeamFees;

function addMonthsClamped(dateStr, months) {
  var s = ymd(dateStr);
  var y = Number(s.slice(0, 4));
  var m = Number(s.slice(5, 7)) - 1 + months;
  var d = Number(s.slice(8, 10));
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  var lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  var day = Math.min(d, lastDay);
  return (
    String(y).padStart(4, "0") +
    "-" +
    String(m + 1).padStart(2, "0") +
    "-" +
    String(day).padStart(2, "0")
  );
}

function buildInstallmentPlan(total, count, firstDueDate) {
  var n = Math.max(1, Math.floor(count || 1));
  var totalCents = toCents(total);
  var base = Math.floor(totalCents / n);
  var plan = [];
  for (var i = 0; i < n; i++) {
    var cents = i === n - 1 ? totalCents - base * (n - 1) : base;
    plan.push({ dueDate: addMonthsClamped(firstDueDate, i), amount: cents / 100 });
  }
  return plan;
}
exports.buildInstallmentPlan = buildInstallmentPlan;

function calculateInstallmentStanding(installments, totalPaid, today, invoiceTotal) {
  var todayStr = ymd(today);
  var paidCents = toCents(totalPaid);
  var list = (installments || [])
    .map(function (i) {
      return { dueDate: ymd(i.dueDate), cents: toCents(i.amount) };
    })
    .sort(function (a, b) {
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    });

  var dueCents = 0;
  var nextDueDate = null;
  var nextDueAmount = null;

  if (list.length === 0) {
    // No plan: the whole invoice is due now.
    dueCents = toCents(invoiceTotal);
  } else {
    var running = 0;
    for (var i = 0; i < list.length; i++) {
      running += list[i].cents;
      if (list[i].dueDate <= todayStr) {
        dueCents = running;
      } else if (nextDueDate === null && running > paidCents) {
        nextDueDate = list[i].dueDate;
        nextDueAmount = (running - Math.max(paidCents, dueCents)) / 100;
      }
    }
  }

  var behindCents = Math.max(0, dueCents - paidCents);
  return {
    dueToDate: dueCents / 100,
    paid: paidCents / 100,
    behindAmount: behindCents / 100,
    isBehind: behindCents > 0,
    nextDueDate: nextDueDate,
    nextDueAmount: nextDueAmount,
  };
}
exports.calculateInstallmentStanding = calculateInstallmentStanding;
