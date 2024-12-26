/**
 * Converts weight between kilograms (Kg) and pounds (Lbs).
 *
 * @param {number} weight - The weight value to be converted.
 * @param {"Kg" | "Lbs"} from - The unit of the input weight. Can be "Kg" or "Lbs".
 * @param {"Kg" | "Lbs"} to - The unit of the output weight. Can be "Kg" or "Lbs".
 *
 * @returns {number} The converted weight value.
 */
export const convertWeightUnits = (
  weight: number,
  from: "Kg" | "Lbs",
  to: "Kg" | "Lbs"
): number => {
  if (from === "Kg" && to === "Lbs") {
    return Math.round((weight * 2.20462 + Number.EPSILON) * 100) / 100;
  }

  if (from === "Lbs" && to === "Kg") {
    return Math.round((weight / 2.20462 + Number.EPSILON) * 100) / 100;
  }

  return weight; // This should only be the case where the units are the same or an invalid unit is passed
};
