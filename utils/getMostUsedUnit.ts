import { Set } from "@/types/sets";

/**
 * Finds the most frequently used unit from a set of data.
 *
 * The function works by first reducing the data into an object where the keys are the units
 * and the values are the frequencies of those units. It then converts this frequency map
 * into an array of key-value pairs and reduces it to find the unit with the highest frequency.
 *
 * @remarks This function currently is intended for use with distance units, however it has been
 * specifically designed to be flexible and can be used with other unit types as well as it has
 * no real dependencies on the units themselves and is rather an end to a means for other solutions.
 * In the event that it is used with other unit types, the return type should be updated to reflect
 * this.
 *
 * @param {Set[]} data - An array of Set objects, each containing a distance unit.
 * @returns {"Km" | "Mi" | "M" | "Ft"} - The most frequently used unit.
 */
export const getMostUsedUnit = (data: Set[]): "Km" | "Mi" | "M" | "Ft" => {
  // We need to find the most used unit for conversions, reducing into an object with the unit as the key
  // and the frequency as the value gives us a flexible and performant way to find the most used unit
  const unitFrequencyMap = data.reduce((acc, set: Set) => {
    if (acc[set.distance_unit!]) {
      acc[set.distance_unit!] += 1;
      return acc;
    }
    acc[set.distance_unit!] = 1;
    return acc;
  }, {} as { [key: string]: number }) as Record<
    "Km" | "Mi" | "M" | "Ft",
    number
  >;

  // We need to convert the frequency map to an array of key value pairs to reduce and find the unit with the highest frequency
  const keyWithHighestValue = Object.entries(unitFrequencyMap)
    // Sort would work but is O(n log n) and we can do this in O(n) with a reduce
    .reduce(
      (acc, [key, value]) => {
        return value > acc[1] ? [key, value] : acc;
      },
      ["", 0] // We won't have a unit with 0 frequency or less so this is fine
    )[0]; // We only need the key from the key value pair

  return keyWithHighestValue as "Km" | "Mi" | "M" | "Ft";
};
