export function friendlyUploadError(err: unknown): string {
  if (!err) return "Upload failed";
  const message = (err as { message?: string }).message ?? "";
  const name = (err as { name?: string }).name ?? "";
  const rawStatus =
    (err as { statusCode?: string | number }).statusCode ??
    (err as { status?: number }).status;
  const status =
    typeof rawStatus === "string" ? parseInt(rawStatus, 10) : rawStatus;
  const lower = message.toLowerCase();

  if (
    typeof navigator !== "undefined" &&
    "onLine" in navigator &&
    navigator.onLine === false
  ) {
    return "You're offline — check your connection and try again";
  }
  if (name === "TimeoutError" || lower.includes("timeout") || lower.includes("timed out")) {
    return "Request timed out — please try again";
  }
  if (name === "AbortError") {
    return "Request was cancelled";
  }
  if (
    message === "Failed to fetch" ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed")
  ) {
    return "Network error — check your connection and try again";
  }
  if (status === 413 || lower.includes("payload too large") || lower.includes("too large")) {
    return "File is too large to upload";
  }
  if (status === 401 || lower.includes("jwt") || lower.includes("unauthorized")) {
    return "Session expired — please refresh and try again";
  }
  if (
    status === 403 ||
    lower.includes("row-level security") ||
    lower.includes("row level security") ||
    lower.includes("permission")
  ) {
    return "Permission denied for this space";
  }
  if (status === 409 || lower.includes("already exists") || lower.includes("duplicate")) {
    return "A file with this name already exists";
  }
  if (status === 429 || lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many uploads — please wait and try again";
  }
  if (status && status >= 500) {
    return "Server error — please try again";
  }

  return message || "Upload failed";
}
