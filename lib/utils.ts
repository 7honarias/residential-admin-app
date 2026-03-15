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

/**
 * Format a number as currency (USD/COP style)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Generate unique idempotency key for API requests
 * Uses UUID v4 with timestamp to ensure uniqueness and reproducibility
 * @returns Unique idempotency key (UUID v4 format)
 */
export const generateIdempotencyKey = (): string => {
  // Use built-in crypto API (available in modern browsers and Node.js 15+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get idempotency key from sessionStorage or generate a new one
 * Useful for allowing safe retries of the same request
 * @param storageKey - Storage key to use
 * @returns Idempotency key
 */
export const getOrGenerateIdempotencyKey = (storageKey: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: just generate a new one
    return generateIdempotencyKey();
  }

  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    return stored;
  }

  const newKey = generateIdempotencyKey();
  sessionStorage.setItem(storageKey, newKey);
  return newKey;
};
