/**
 * Converts a distance from one unit to another.
 *
 * @param {number} distance - The distance to convert.
 * @param {"Km" | "Mi" | "M" | "Ft"} from - The unit of the input distance. Can be "km", "m", "mi" or "ft".
 * @param {"Km" | "Mi" | "M" | "Ft"} to - The unit to convert the distance to. Can be "km", "m", "mi" or "ft".
 *
 * @returns {number} The converted distance in the target unit.
 */
export const convertDistanceUnits = (
  distance: number,
  from: "Km" | "Mi" | "M" | "Ft",
  to: "Km" | "Mi" | "M" | "Ft"
): number => {
  if (from === to) {
    return distance;
  }

  const conversions: {
    [key: string]: { [key: string]: (input: number) => number };
  } = {
    Km: {
      M: (kmInput: number) => kmInput * 1000,
      Mi: (kmInput: number) => kmInput * 0.621371192237,
      Ft: (kmInput: number) => kmInput * 3280.8398950131,
    },
    M: {
      Km: (mInput: number) => mInput / 1000,
      Mi: (mInput: number) => mInput * 0.000621371192237,
      Ft: (mInput: number) => mInput * 3.2808398950131,
    },
    Mi: {
      Km: (miInput: number) => miInput * 1.609344,
      M: (miInput: number) => miInput * 1609.344,
      Ft: (miInput: number) => miInput * 5280,
    },
    Ft: {
      Km: (ftInput: number) => ftInput / 3280.8398950131,
      M: (ftInput: number) => ftInput / 3.2808398950131,
      Mi: (ftInput: number) => ftInput / 5280,
    },
  };

  return conversions[from][to](distance);
};
