/**
 * Returns the current date in ISO 8601 format.
 *
 * @returns {string} The current date.
 */
export const getToday = (): string => {
  const dateObj = new Date();
  dateObj.setHours(0, 0, 0, 0);
  return dateObj.toISOString();
};
