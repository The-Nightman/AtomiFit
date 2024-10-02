import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Set } from "@/types/sets";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useContext, useRef, useState } from "react";
import SelectTextInput from "./inputs/SelectTextInput";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";

interface TrackSetListItemProps {
  set: Set;
  setNumber: number;
  setColumnWidth: number;
  menuVisible: any;
  setMenuVisible: (
    id: number,
    val: boolean,
    pos: { x: number; y: number }
  ) => void;
  containerRef: React.RefObject<View>;
}

/**
 * TrackSetListItem component renders a list item representing a set in a workout tracking application.
 *
 * @component
 * @param {TrackSetListItemProps} props - The properties passed to the component.
 * @param {Set} props.set - The set data to be displayed and managed.
 * @param {number} props.setNumber - The number of the set in the sequence i.e. index + 1.
 * @param {number} props.setColumnWidth - The width of the set number column.
 * @param {boolean} props.menuVisible - The visibility state of the options menu.
 * @param {function(number, boolean, { x: number; y: number }): void} props.setMenuVisible - Function to set the visibility state of the options menu.
 * @param {React.RefObject<View>} props.containerRef - Reference to the container view for layout measurements.
 *
 * @returns {JSX.Element} The rendered TrackSetListItem component.
 *
 * @example
 * ```tsx
 * <TrackSetListItem
 *   set={set}
 *   setNumber={1}
 *   setColumnWidth={50}
 *   menuVisible={menuVisible}
 *   setMenuVisible={setMenuVisible}
 *   containerRef={containerRef}
 * />
 * ```
 */
const TrackSetListItem = ({
  set,
  setNumber,
  setColumnWidth,
  menuVisible,
  setMenuVisible,
  containerRef,
}: TrackSetListItemProps): JSX.Element => {
  const [setData, setSetData] = useState<Set>(set);
  const { db } = useContext(DrizzleContext);
  const ListItemRef = useRef<View>(null);

  /**
   * Handles the change in the number of repetitions.
   *
   * This function returns another function that takes a string value,
   * converts it to a number, and updates the state with the new
   * number of repetitions.
   *
   * @returns A function that takes a string value representing the number of repetitions.
   */
  const handleRepsChange = () => (val: string) => {
    setSetData({ ...setData, reps: Number(val) });
  };

  /**
   * Handles the change in weight input by the user.
   *
   * This function processes the input value to ensure it is in a valid format
   * before updating the state with the new weight. If the input starts with a
   * decimal point, a leading zero is added to the value.
   *
   * @returns A function that takes a string value as input and updates the weight in the state.
   * @param val - The input value representing the weight.
   */
  const handleWeightChange =
    () =>
    (val: string): void => {
      let processedVal = val;
      if (/^\.+\d*$/.test(processedVal)) {
        processedVal = val.padStart(val.length + 1, "0"); // Add leading zero if decimal point is first character
      }

      setSetData({ ...setData, weight: Number(processedVal) });
    };

  /**
   * Asynchronously saves the set data to the database.
   *
   * This function checks if the `setData.id` is a number.
   * If it is, it updates the set data in the database and returns the full row result.
   * If `setData.id` is undefined no action is performed currently.
   * This may be expanded upon in the future, currently new sets are generated in the parent screen
   * and added to the database there where an id is returned and added to the set object.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the set data has been saved.
   */
  const saveSet = async (): Promise<void> => {
    if (typeof setData.id === "number") {
      // Database returns are always arrays, so we need to destructure the first element
      const [updatedSet]: Set[] = await db
        .update(schema.setsData)
        .set(setData)
        .where(eq(schema.setsData.id, setData.id))
        .returning();
      setSetData(updatedSet);
    }
  };

  /**
   * Handles the opening of the menu in parent by measuring the layout of the ListItemRef
   * relative to the containerRef and setting the menu's visibility and position.
   *
   * @remarks
   * This function uses the `measureLayout` method to get the position and size
   * of the ListItemRef relative to the containerRef. It then sets the menu's
   * visibility and position based on these measurements. Menu is stored in the parent
   * due to issues with placement and z-indexing, this is a solution to that.
   *
   * @returns {void}
   */
  const handleMenuOpen = (): void => {
    ListItemRef.current?.measureLayout(
      containerRef.current!,
      (_left, top, _width, height) => {
        setMenuVisible(set.id!, !menuVisible.state, {
          x: 8,
          y: top + (height + 4), // distance from the top relative to parent + ( height of component + 4 (half of gap))
        });
      }
    );
  };

  return (
    <View
      collapsable={false}
      ref={ListItemRef}
      style={styles.setListItemContainer}
    >
      <Text style={[{ width: setColumnWidth }, styles.setNumber]}>
        {setNumber + 1}
      </Text>
      <Pressable
        onPress={() => console.log(set.notes)}
        style={styles.justifyCenter}
      >
        <MaterialIcons
          name="speaker-notes"
          size={24}
          color={set.notes ? "#60DD49" : hexcodeLuminosity("#3F3C3C", 40)}
        />
      </Pressable>
      {/* Records indicator, not yet fully implemented but required for layout */}
      <Pressable
        onPress={() => console.log("PR, not yet implemented")}
        style={styles.setPrButton}
      >
        <MaterialCommunityIcons name="trophy" size={24} color="#60DD49" />
      </Pressable>
      <View style={styles.setListItemSubContainer}>
        <View style={styles.inputsContainer}>
          <SelectTextInput
            inputType="decimal"
            value={setData.weight!.toString()}
            validation={/^\d*\.?\d{0,2}$/} // Int or float validation
            //! must allow floats without leading digits or else MAJOR inconvenience to user so extra validation is needed
            onChangeFunc={handleWeightChange()}
            onBlurFunc={() => saveSet()}
            style={styles.inputStyles}
            focusStyle={styles.inputFocusStyles}
            selectionColor={"white"}
          />
          <SelectTextInput
            inputType="decimal"
            value={setData.reps!.toString()}
            validation={/^\d*$/}
            onChangeFunc={handleRepsChange()}
            onBlurFunc={() => saveSet()}
            style={styles.inputStyles}
            focusStyle={styles.inputFocusStyles}
            selectionColor={"white"}
          />
        </View>
        {/* Open menu button, menu has to be in parent */}
        <Pressable
          onPress={() => handleMenuOpen()}
          style={styles.justifyCenter}
        >
          <Entypo name="dots-three-vertical" size={24} color={"#9F9F9F"} />
        </Pressable>
      </View>
    </View>
  );
};

export default TrackSetListItem;

const styles = StyleSheet.create({
  setListItemContainer: {
    flexDirection: "row",
    height: 36,
    justifyContent: "space-between",
    paddingHorizontal: 8,
    gap: 16,
  },
  setNumber: {
    minWidth: 18, // This prevents the jump on layout from being as jarring and obvious
    color: "white",
    fontSize: 17,
    textAlign: "center",
    alignSelf: "center",
  },
  setPrButton: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  setListItemSubContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  inputsContainer: { flex: 1, flexDirection: "row", gap: 16 },
  inputStyles: {
    flex: 1,
    backgroundColor: "#3F3C3C",
    borderRadius: 10,
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
  inputFocusStyles: { color: "black", backgroundColor: "#60DD49" },
  justifyCenter: { justifyContent: "center" },
});
