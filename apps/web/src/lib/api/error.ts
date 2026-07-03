export class ApiError extends Error {
  status: number;
  statusText: string;
  rawMessage?: string;

  constructor(status: number, statusText: string, message?: string) {
    let cleanMessage = message;
    if (message) {
      try {
        const parsed = JSON.parse(message);
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.message)) {
            cleanMessage = parsed.message.join(", ");
          } else if (typeof parsed.message === "string") {
            cleanMessage = parsed.message;
          }
        }
      } catch {
        // Not a JSON string, keep message as is
      }
    }

    super(cleanMessage || `API Error: ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.rawMessage = message;
  }
}

