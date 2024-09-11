/**
 * Displays a formatted date string based on the given date.
 * If the date is today, it returns "TODAY".
 * If the date is yesterday, it returns "YESTERDAY".
 * Otherwise, it returns the date formatted as a short weekday, short month, numeric day and numeric year.
 *
 * @param {string} date - The date string in yyyy-mm-dd format to be formatted.
 * @param {string} today - The current date string in yyyy-mm-dd format.
 * @returns {string} The formatted date string.
 */
export const displayDate = (date: string, today: string): string => {
  if (date === today) {
    return "TODAY";
  } else if (
    new Date(date) ===
    new Date(new Date(today).setDate(new Date(today).getDate() - 1))
  ) {
    return "YESTERDAY";
  }

  return new Date(date)
    .toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
};
