/**
 * Formats the distance for display.
 *
 * @param {number} distance - The distance to be formatted.
 * @returns {string} The formatted distance as a string.
 */
export const distanceDisplay = (distance: number): string => {
  return distance < 1000
    ? `${distance} M`
    : `${(distance / 1000).toFixed(2)} KM`;
};
