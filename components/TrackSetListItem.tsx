import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Set } from "@/types/sets";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useContext, useRef, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import WeightInput from "./inputs/exerciseRecords/WeightInput";
import RepsInput from "./inputs/exerciseRecords/RepsInput";
import DistanceInput from "./inputs/exerciseRecords/DistanceInput";
import TimeInput from "./inputs/exerciseRecords/TimeInput";
import { setDisplayVariant } from "@/utils/setDisplayVariant";
import { DistanceUnit } from "@/types/units";
import { eventEmitter } from "@/utils/eventEmitter";

interface TrackSetListItemProps {
  set: Set;
  setNumber: number;
}

/**
 * TrackSetListItem component renders a list item representing a set in a workout tracking application.
 *
 * @remarks This component makes user of the eventEmitter to display a menu modal for
 * options regarding the set via the `setMenu` event.
 *
 * @component
 * @param {TrackSetListItemProps} props - The properties passed to the component.
 * @param {Set} props.set - The set data to be displayed and managed.
 * @param {number} props.setNumber - The number of the set in the sequence i.e. index + 1.
 *
 * @returns {JSX.Element} The rendered TrackSetListItem component.
 *
 * @example
 * ```tsx
 * <TrackSetListItem
 *   set={set}
 *   setNumber={1}
 * />
 * ```
 */
const TrackSetListItem = ({
  set,
  setNumber,
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
   * Asynchronously handles saving the time value from the child modal component.
   *
   * This function updates the `setData` state with the new time value and
   * persists the change to the database. If the `id` of the updated state
   * is a number, it updates the corresponding record in the database and
   * updates the state with the updated row.
   *
   * @remarks
   * This function is seperate to the `saveSet` function as it is called from a child component
   * to elevate the value as it is not automatically set to the parent state due to being a modal.
   *
   * @async
   * @param {number} val - The new time value to be saved.
   *
   * @returns {Promise<void>} A promise that resolves when the save operation is complete.
   */
  const handleTimeSave = async (val: number): Promise<void> => {
    const updatedState = { ...setData, time: val };
    if (typeof updatedState.id === "number") {
      // Database returns are always arrays, so we need to destructure the first element
      const [updatedSet]: Set[] = await db
        .update(schema.setsData)
        .set(updatedState)
        .where(eq(schema.setsData.id, updatedState.id))
        .returning();
      setSetData(updatedSet);
    }
  };

  /**
   * Handles the saving of distance data for a set.
   *
   * This function updates the state with the new distance value and, if the set has a valid ID,
   * updates the corresponding record in the database. The updated set data is then stored in the state.
   *
   * @remarks
   * This function is seperate to the `saveSet` function as it is called from a child component
   * to elevate the value as it is not automatically set to the parent state due to being a modal.
   *
   * @async
   * @param {Object} distanceObj - An object containing the distance value and its unit.
   * @param {number} distanceObj.distance - The distance value to be saved.
   * @param {DistanceUnit} distanceObj.unit - The unit of the distance, which can be "Km", "M", "Mi", or "Ft".
   *
   * @returns {Promise<void>} A promise that resolves to void.
   */
  const handleDistanceSave = async (distanceObj: {
    distance: number;
    unit: DistanceUnit;
  }): Promise<void> => {
    const updatedState = {
      ...setData,
      distance: distanceObj.distance,
      distance_unit: distanceObj.unit,
    };
    if (typeof updatedState.id === "number") {
      // Database returns are always arrays, so we need to destructure the first element
      const [updatedSet]: Set[] = await db
        .update(schema.setsData)
        .set(updatedState)
        .where(eq(schema.setsData.id, updatedState.id))
        .returning();
      setSetData(updatedSet);
    }
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
   * Retrieves the position of the ListItemRef component.
   *
   * This function measures the position and dimensions of the ListItemRef component
   * and returns a Promise that resolves with an object containing the x and y coordinates
   * and an offset value. The offset value is half the height of the component, which is used
   * to properly offset the menu so that it does not begin halfway down the component.
   *
   * @returns {Promise<{ x: number, y: number, offset: number }>} A promise that resolves with an object containing the x and y coordinates and the offset value.
   */
  const getPositon = (): Promise<{ x: number; y: number; offset: number }> => {
    return new Promise((resolve) => {
      ListItemRef.current?.measure(
        (
          x: number,
          _y: number,
          _width: number,
          height: number,
          _pageX: number,
          pageY: number
        ) => {
          // We want to half the height of the component so we can properly offset
          // the menu otherwise the menu will begin halfway down the component
          resolve({ x: x - 20, y: pageY, offset: height / 2 });
        }
      );
    });
  };

  // Dictionary of display variants based on the keys of the set object
  const displayVariants: Record<string, () => React.JSX.Element> = {
    weight_reps: () => (
      <>
        <WeightInput
          value={setData.weight!.toString()}
          onChangeFunc={handleWeightChange()}
          onBlurFunc={() => saveSet()}
          style={styles.inputStyles}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={setData.weight_unit}
        />
        <RepsInput
          value={setData.reps!.toString()}
          onChangeFunc={handleRepsChange()}
          onBlurFunc={() => saveSet()}
          style={styles.inputStyles}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={" Reps"}
        />
      </>
    ),
    distance_time: () => (
      <>
        <DistanceInput
          value={setData.distance!.toString()}
          validation={/^\d*\.?\d{0,2}$/}
          saveDistance={handleDistanceSave}
          inputStyle={styles.distanceInputStyle}
          initialButtonStyle={styles.timeInputInitialButtonStyle}
          initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={setData.distance_unit}
        />
        <TimeInput
          value={setData.time!}
          saveTime={handleTimeSave}
          initialButtonStyle={styles.timeInputInitialButtonStyle}
          initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
          inputStyle={styles.timeInputTextInputStyle}
          focusStyle={styles.inputFocusStyles}
          inputContainerFocusColour={"#60DD49"}
          selectionColor={"white"}
        />
      </>
    ),
    weight_distance: () => (
      <>
        <WeightInput
          value={setData.weight!.toString()}
          onChangeFunc={handleWeightChange()}
          onBlurFunc={() => saveSet()}
          style={styles.inputStyles}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={setData.weight_unit}
        />
        <DistanceInput
          value={setData.distance!.toString()}
          validation={/^\d*\.?\d{0,2}$/}
          saveDistance={handleDistanceSave}
          inputStyle={styles.distanceInputStyle}
          initialButtonStyle={styles.timeInputInitialButtonStyle}
          initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={setData.distance_unit}
        />
      </>
    ),
    weight_time: () => (
      <>
        <WeightInput
          value={setData.weight!.toString()}
          onChangeFunc={handleWeightChange()}
          onBlurFunc={() => saveSet()}
          style={styles.inputStyles}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={setData.weight_unit}
        />
        <TimeInput
          value={setData.time!}
          saveTime={handleTimeSave}
          initialButtonStyle={styles.timeInputInitialButtonStyle}
          initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
          inputStyle={styles.timeInputTextInputStyle}
          focusStyle={styles.inputFocusStyles}
          inputContainerFocusColour={"#60DD49"}
          selectionColor={"white"}
        />
      </>
    ),
    reps_distance: () => (
      <>
        <RepsInput
          value={setData.reps!.toString()}
          onChangeFunc={handleRepsChange()}
          onBlurFunc={() => saveSet()}
          style={styles.inputStyles}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={" Reps"}
        />
        <DistanceInput
          value={setData.distance!.toString()}
          validation={/^\d*\.?\d{0,2}$/}
          saveDistance={handleDistanceSave}
          inputStyle={styles.distanceInputStyle}
          initialButtonStyle={styles.timeInputInitialButtonStyle}
          initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={setData.distance_unit}
        />
      </>
    ),
    reps_time: () => (
      <>
        <RepsInput
          value={setData.reps!.toString()}
          onChangeFunc={handleRepsChange()}
          onBlurFunc={() => saveSet()}
          style={styles.inputStyles}
          focusStyle={styles.inputFocusStyles}
          selectionColor={"white"}
          suffix={" Reps"}
        />
        <TimeInput
          value={setData.time!}
          saveTime={handleTimeSave}
          initialButtonStyle={styles.timeInputInitialButtonStyle}
          initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
          inputStyle={styles.timeInputTextInputStyle}
          focusStyle={styles.inputFocusStyles}
          inputContainerFocusColour={"#60DD49"}
          selectionColor={"white"}
        />
      </>
    ),
    weight: () => (
      <WeightInput
        value={setData.weight!.toString()}
        onChangeFunc={handleWeightChange()}
        onBlurFunc={() => saveSet()}
        style={styles.inputStyles}
        focusStyle={styles.inputFocusStyles}
        selectionColor={"white"}
        suffix={setData.weight_unit}
      />
    ),
    reps: () => (
      <RepsInput
        value={setData.reps!.toString()}
        onChangeFunc={handleRepsChange()}
        onBlurFunc={() => saveSet()}
        style={styles.inputStyles}
        focusStyle={styles.inputFocusStyles}
        selectionColor={"white"}
        suffix={" Reps"}
      />
    ),
    distance: () => (
      <DistanceInput
        value={setData.distance!.toString()}
        validation={/^\d*\.?\d{0,2}$/}
        saveDistance={handleDistanceSave}
        inputStyle={styles.distanceInputStyle}
        initialButtonStyle={styles.timeInputInitialButtonStyle}
        initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
        focusStyle={styles.inputFocusStyles}
        selectionColor={"white"}
        suffix={setData.distance_unit}
      />
    ),
    time: () => (
      <TimeInput
        value={setData.time!}
        saveTime={handleTimeSave}
        initialButtonStyle={styles.timeInputInitialButtonStyle}
        initialButtonTextStyle={styles.timeInputInitialButtonTextStyle}
        inputStyle={styles.timeInputTextInputStyle}
        focusStyle={styles.inputFocusStyles}
        inputContainerFocusColour={"#60DD49"}
        selectionColor={"white"}
      />
    ),
  };

  return (
    <View
      collapsable={false}
      ref={ListItemRef}
      style={styles.setListItemContainer}
    >
      <Text style={styles.setNumber}>{setNumber + 1}</Text>
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
          {setDisplayVariant(set, displayVariants)}
        </View>
        {/* Open menu button, menu has to be in parent */}
        <Pressable
          onPress={async () => {
            const pos = await getPositon();
            eventEmitter.emit("setMenu", set.id, pos);
          }}
          style={styles.menuButton}
          hitSlop={8}
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
    minHeight: 40,
    justifyContent: "space-between",
    paddingLeft: 8, // This is perfectly fine to do as there will be some "empty" space on the right side around the menu button
    paddingRight: 2,
    gap: 12,
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
    gap: 4,
  },
  inputsContainer: { flex: 1, flexDirection: "row", gap: 12 },
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
  menuButton: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 36,
    borderRadius: 10,
  },
  timeInputInitialButtonStyle: {
    flex: 1,
    backgroundColor: "#3F3C3C",
    borderRadius: 10,
    justifyContent: "center",
  },
  timeInputInitialButtonTextStyle: {
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
  timeInputTextInputStyle: {
    flex: 1,
    color: "white",
    fontSize: 35,
    fontWeight: "500",
    textAlign: "center",
  },
  distanceInputStyle: {
    backgroundColor: "#3F3C3C",
    borderRadius: 10,
    padding: 12,
    color: "white",
    fontSize: 35,
    fontWeight: "500",
    textAlign: "center",
  },
});
