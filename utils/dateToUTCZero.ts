/**
 * Converts a given date to UTC+0 or "Zulu" Time.
 *
 * This function takes a Date object and adjusts it to the UTC+0 by
 * subtracting the timezone offset in minutes from the date's current time.
 * This is useful for accounting for the timezone offset caused by daylight
 * savings or meridians where issues are present with these as the cause.
 *
 * @param {Date} date - The date to be converted to UTC+0.
 * @returns {Date} A new Date object set to UTC+0.
 */
export const dateToUTCZero = (date: Date): Date => {
  return new Date(
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  );
};
