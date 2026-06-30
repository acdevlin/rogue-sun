/**
 * Generates a random UUID suitable for team identifiers.
 *
 * @returns A v4 UUID string.
 */
export const generateId = () => crypto.randomUUID();
