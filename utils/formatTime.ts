/**
 * Formats the given time in seconds into a string representation of hours, minutes, and seconds.
 *
 * @param {number} seconds - The time in seconds to format.
 * @returns {string} A string representation of the formatted time in a HH:MM:SS format.
 */
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
};
