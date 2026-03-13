/**
 * Calculates the current academic year based on the current date.
 * Academic year starts from June.
 * Example: if date is March 2026, returns "2025-2026"
 * if date is June 2026, returns "2026-2027"
 */
export const getCurrentAcademicYear = (): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Return the academic year starting in the current calendar year
    // Example: 2026 -> "2026-2027"
    return `${currentYear}-${currentYear + 1}`;
};
