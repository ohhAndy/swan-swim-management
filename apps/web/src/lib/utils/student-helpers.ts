export function calcAge(birthdateString: string): number {
  const birthdate = new Date(birthdateString);
  const today = new Date();

  let age = today.getFullYear() - birthdate.getFullYear();

  const hadBirthdayThisYear =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() &&
      today.getDate() >= birthdate.getDate());

  if (!hadBirthdayThisYear) age--;

  return age;
}

export function markClass(status: string | undefined) {
  switch (status) {
    case "P": // Present
      return "bg-green-100 text-green-800";
    case "A": // Absent
      return "bg-red-100 text-red-800";
    case "E": // Excused
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-50";
  }
}

export function getMakeUpStatusColour(status: string) {
  switch (status) {
    case "attended":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "requested":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-orange-100 text-orange-800";
    case "missed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getTrialStatusColour(status: string) {
  switch (status) {
    case "attended":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-purple-100 text-purple-800";
    case "noshow":
      return "bg-red-100 text-red-800";
    case "converted":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export interface ReportCardStatusConfig {
  label: string;
  className: string;
}

export function getReportCardStatusConfig(
  status: string | null | undefined,
  context: "row" | "mobile" | "desktop"
): ReportCardStatusConfig {
  const s = status || "not_created";

  if (context === "row") {
    switch (s) {
      case "not_created":
        return {
          label: "None",
          className: "bg-white text-gray-400 hover:bg-gray-50",
        };
      case "created":
        return {
          label: "Created",
          className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        };
      case "draft":
        return {
          label: "Draft",
          className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        };
      case "sent":
        return {
          label: "Sent",
          className: "bg-green-100 text-green-700 hover:bg-green-200",
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-green-100 text-green-700 hover:bg-green-200",
        };
      case "did_not_pass":
        return {
          label: "Did Not Pass",
          className: "bg-red-100 text-red-700 hover:bg-red-200",
        };
      case "given":
        return {
          label: "Given",
          className: "bg-green-100 text-green-700 hover:bg-green-200",
        };
      default:
        return {
          label: "None",
          className: "bg-green-100 text-green-700 hover:bg-green-200",
        };
    }
  } else if (context === "mobile") {
    switch (s) {
      case "completed":
        return {
          label: "RC Completed",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "sent":
        return {
          label: "RC Sent",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "given":
        return {
          label: "RC Given",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "created":
      case "draft":
        return {
          label: "RC Draft",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "did_not_pass":
        return {
          label: "RC Fail",
          className: "bg-red-100 text-red-700 border-red-200",
        };
      default:
        return {
          label: "No RC",
          className: "bg-gray-100 text-gray-500",
        };
    }
  } else {
    switch (s) {
      case "completed":
        return {
          label: "Completed",
          className: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
        };
      case "sent":
        return {
          label: "Sent",
          className: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
        };
      case "given":
        return {
          label: "Given",
          className: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
        };
      case "created":
      case "draft":
        return {
          label: "Draft",
          className: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
        };
      case "did_not_pass":
        return {
          label: "Did Not Pass",
          className: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
        };
      default:
        return {
          label: "None",
          className: "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100",
        };
    }
  }
}

