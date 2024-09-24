/**
 * Adjusts the luminosity of a given hex color by a specified magnitude.
 *
 * @param {string} hexColour - The hex color code to be adjusted. It should be a 6-character string prefixed with `#`.
 * @param {number} magnitude - The amount by which to adjust the luminosity. Positive values lighten the color, while negative values darken it.
 * @returns {string} The adjusted hex color code. If the input hex color is not a 6-character string, the original hex color is returned.
 */
export const hexcodeLuminosity = (
  hexColour: string,
  magnitude: number
): string => {
  hexColour = hexColour.replace(`#`, ``);
  // Check if the hex colour is a 6-character string
  if (hexColour.length === 6) {
    // Convert the hex colour to a 16-bit decimal
    const decimalColour = parseInt(hexColour, 16);
    // Extract the RGB components and adjust them by the magnitude
    // Extract red with a 16-bit right shift and adjust
    let r: number = (decimalColour >> 16) + magnitude;
    r > 255 && (r = 255);
    r < 0 && (r = 0);
    // Extract green with a bitwise AND mask and adjust
    let g: number = (decimalColour & 0x0000ff) + magnitude;
    g > 255 && (g = 255);
    g < 0 && (g = 0);
    // Extract blue with an 8-bit right shift, bitwise AND mask and adjust
    let b: number = ((decimalColour >> 8) & 0x00ff) + magnitude;
    b > 255 && (b = 255);
    b < 0 && (b = 0);
    // Return the adjusted hex colour as a string
    return `#${(g | (b << 8) | (r << 16)).toString(16)}`;
  } else {
    // Return the original hex colour if it is not a 6-character string
    return hexColour;
  }
};
