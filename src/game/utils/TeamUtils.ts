/**
 * Generates a random alphanumeric ID string suitable for team identifiers.
 *
 * @returns A 26-character pseudo-random string.
 */
export const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
