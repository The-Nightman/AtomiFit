/**
 * Calculates the luminance of a hex colour and returns either black or white
 * for optimal text contrast.
 *
 * The luminace calculation is based on the Y component of the YIQ colour space.
 * https://en.wikipedia.org/wiki/YIQ#From_RGB_to_YIQ
 *
 * @param {string} hexColour - The hex colour code.
 * @returns {string} - The optimal text colour (black or white).
 */
export const getContrastTextColour = (hexColour: string): string => {
  const hexValues = hexColour.replace("#", "");

  // We'll use the hex numbers converted to int to calculate the luminance
  const r = parseInt(hexValues.substring(0, 2), 16);
  const g = parseInt(hexValues.substring(2, 4), 16);
  const b = parseInt(hexValues.substring(4, 6), 16);

  // Calculate luminance (Y component of YIQ colour space) - see: https://en.wikipedia.org/wiki/YIQ#From_RGB_to_YIQ
  const yComponent = (r * 299 + g * 587 + b * 114) / 1000;

  // We return the appropriate text colour based on the luminance
  return yComponent >= 128 ? "#000000" : "#FFFFFF";
};
