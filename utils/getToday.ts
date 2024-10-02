/**
 * Returns the current date in the format "YYYY-MM-DD".
 *
 * @returns {string} The current date.
 */
export const getToday = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
