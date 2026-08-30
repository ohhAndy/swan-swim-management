"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateClassUsage = exports.getRatioWeight = exports.CLASS_RATIO_WEIGHTS = void 0;

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
