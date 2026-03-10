/**
 * Utility functions for the application
 */

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "9 de marzo de 2026")
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Intl.DateTimeFormat("es-ES", options).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Format a date string to a short format
 * @param dateString - ISO date string
 * @returns Short formatted date string (e.g., "9/3/2026")
 */
export const formatDateShort = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Intl.DateTimeFormat("es-ES", options).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Encode cursor payload to base64
 * @param payload - The cursor payload object
 * @returns Base64 encoded string
 */
export const encodeCursor = (payload: { created_at: string; id: string }): string => {
  try {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  } catch {
    return "";
  }
};

/**
 * Decode cursor from base64
 * @param cursor - The base64 encoded cursor string
 * @returns Decoded cursor payload or null
 */
export const decodeCursor = (
  cursor: string
): { created_at: string; id: string } | null => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};
