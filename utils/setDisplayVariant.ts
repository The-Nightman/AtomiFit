import { Set } from "@/types/sets";

/**
 * Sets the set display variant from a dictionary of TSX elements based on the keys of the set object.
 *
 * @param {Set} setObj - The set object.
 * @param {Record<string, (set: Set) => React.JSX.Element>} displayVariantsDictionary - The dictionary of display variants.
 * 
 * @returns {string} The display variant string.
 * 
 * @example
 * ```tsx
 * const set: Set = {
 *   id: 1,
 *   exercise_id: 1,
 *   weight: 100,
 *   reps: 10,
 *   distance: null,
 *   time: null,
 * };
 * 
 * const displayVariants: Record<string, (setObj: Set) => React.JSX.Element> = {
 *   weight_reps: (setObj: Set) => (
 *     <Text style={styles.text}>
 *       {setObj.weight} KG x {setObj.reps} REPS
 *     </Text>
 *   ),
 * }
 * 
 * return (
 *    <View>
 *      {setDisplayVariant(set, displayVariants)}
 *    </View>
 * );
 * ```
 */
export const setDisplayVariant = (
  setObj: Set,
  displayVariantsDictionary: Record<string, (set: Set) => React.JSX.Element>
): React.JSX.Element => {
  // Define the keys to be checked in the set object
  const keys = ["weight", "reps", "distance", "time"];

  // Filter out nulls and return a string of the keys joined
  const displayKeys: string = keys
    .filter((key: string) => setObj[key as keyof Set] !== null)
    .join("_");

  // Return the display variant from the dictionary based on the result of the keys
  return displayVariantsDictionary[displayKeys](setObj);
};
