import { ColorValue } from "react-native";

/**
 * Generates a random hex color code.
 *
 * @remarks This algorithm was sourced from https://www.paulirish.com/2009/random-hex-color-code-snippets/
 *
 * @returns {ColorValue} A string representing a random hex color code, prefixed with '#'.
 */
export const randomHexcode = (): ColorValue =>
  "#" + Math.floor(Math.random() * 16777215).toString(16);
