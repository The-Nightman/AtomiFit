/**
 * Displays a formatted date string based on the given date.
 * If the date is today, it returns "TODAY".
 * If the date is yesterday, it returns "YESTERDAY".
 * If the date is tomorrow, it returns "TOMORROW".
 * Otherwise, it returns the date formatted as a short weekday, short month, numeric day and numeric year.
 *
 * @param {string} date - The date string in iso 8601 format to be formatted.
 * @param {string} today - The current date string in iso 8601 format.
 * @returns {string} The formatted date string.
 */
export const displayDate = (date: string, today: string): string => {
  if (date === today) {
    return "TODAY";
  } else if (
    date.slice(0, 10) ===
    new Date(new Date(today).setDate(new Date(today).getDate() - 1))
      .toISOString()
      .slice(0, 10)
  ) {
    return "YESTERDAY";
  } else if (
    date.slice(0, 10) ===
    new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      .toISOString()
      .slice(0, 10)
  ) {
    return "TOMORROW";
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
