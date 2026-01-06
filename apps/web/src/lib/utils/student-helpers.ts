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
