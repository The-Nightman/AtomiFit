import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { SetPersonalRecord } from "@/types/sets";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { memo, useContext, useEffect, useRef, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import WeightInput from "../inputs/exerciseRecords/WeightInput";
import RepsInput from "../inputs/exerciseRecords/RepsInput";
import DistanceInput from "../inputs/exerciseRecords/DistanceInput";
import TimeInput from "../inputs/exerciseRecords/TimeInput";
import { setDisplayVariant } from "@/utils/setDisplayVariant";
import { DistanceUnit } from "@/types/units";
import { eventEmitter } from "@/utils/eventEmitter";
import { insertNextBestSet } from "@/utils/db/insertNextBestSet";
import { getPreviousPrSet } from "@/utils/db/getPreviousPrSet";
import { deletePersonalRecord } from "@/utils/db/deletePersonalRecord";
import { insertPersonalRecord } from "@/utils/db/insertPersonalRecord";

interface TrackSetListItemProps {
  set: SetPersonalRecord;
  setNumber: number;
}

/**
 * Compares the previous props and next props to determine if they are equal for memoization.
 *
 * @param {TrackSetListItemProps} prevProps - The previous props of the TrackSetListItem component.
 * @param {TrackSetListItemProps} nextProps - The next props of the TrackSetListItem component.
 * @returns {boolean} A boolean value indicating whether the props are equal.
 */
const propsAreEqual = (
  prevProps: TrackSetListItemProps,
  nextProps: TrackSetListItemProps
): boolean => {
  return (
    JSON.stringify(prevProps.set) === JSON.stringify(nextProps.set) &&
    prevProps.setNumber === nextProps.setNumber
  );
};

/**
 * TrackSetListItem component renders a list item representing a set in a workout tracking application.
 *
 * @remarks This component makes user of the eventEmitter to display a menu modal for
 * options regarding the set via the `setMenu` event.
 *
 * @component
 * @param {TrackSetListItemProps} props - The properties passed to the component.
 * @param {SetPersonalRecord} props.set - The set data to be displayed and managed.
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
const TrackSetListItem = memo(
  ({ set, setNumber }: TrackSetListItemProps): JSX.Element => {
    const [setData, setSetData] = useState<SetPersonalRecord>(set);
    const { db } = useContext(DrizzleContext);
    const ListItemRef = useRef<View>(null);

    // set.personal_record.id should really be the only value we need to look out for
    // This guarantees that the render accurately reflects the personal record status
    useEffect(() => {
      setSetData(set);
    }, [set.personal_record?.id]);

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
    const saveSet = async (setData: SetPersonalRecord): Promise<void> => {
      if (typeof setData.id !== "number") return; // No action if id is invalid and return

      // Personal record logic for weight x reps sets
      if (
        setData.reps !== null &&
        setData.weight !== null &&
        setData.reps > 0 &&
        setData.weight > 0
      ) {
        const previousPrSet = await getPreviousPrSet(
          db,
          setData.exercise_id,
          setData.reps!
        );

        // If set is still pr and the weight or reps have changed
        if (
          // The set prop is always one step behind the setData state which
          // gives us a very convenient method of comparison
          (set.reps !== setData.reps || set.weight !== setData.weight) &&
          set.personal_record &&
          !previousPrSet
        ) {
          // This will give us the next best
          await insertNextBestSet(
            db,
            {
              set_id: set.id!,
              exercise_id: set.exercise_id,
              set_reps: set.reps,
            },
            set.id!
          );

          await deletePersonalRecord(db, set.id!);

          await insertNextBestSet(
            db,
            {
              set_id: set.id!,
              exercise_id: set.exercise_id,
              set_reps: set.reps,
            },
            set.reps!
          );
        }

        // This will only fire if the previousPrSet contains a future set, this will be
        // the case if a user, for example, adds 3 sets of 80kg x 5 reps and the first of
        // these sets is a PR. If the user then goes back and changes the reps to 3 on
        // accident or otherwise, the next set in that sequence will become the PR.
        // If the user then changes the reps back to 5, the 2nd set that was marked a PR
        // set will be deleted. This also covers the case where the user goes to a previous
        // day and edits a set. Without this check we will run into unique errors and the
        // inability for the user to delete the set without first editing it again which
        // is bad UX and an easily avoidable issue.
        if (
          previousPrSet &&
          previousPrSet.id! > setData.id &&
          previousPrSet.date === set.date
        ) {
          await deletePersonalRecord(db, previousPrSet.id!);
        } else if (
          previousPrSet &&
          new Date(previousPrSet.date) > new Date(setData.date)
        ) {
          await deletePersonalRecord(db, previousPrSet.id!);
          await insertPersonalRecord(db, setData.id, setData.exercise_id);
        }

        if (!previousPrSet) {
          // Check that this set is not already a PR i.e. user changes weight or reps and the data still fulfills the PR criteria
          if (setData.personal_record?.set_id !== setData.id) {
            await insertPersonalRecord(db, setData.id, setData.exercise_id);
          }
        } else if (previousPrSet.weight! < setData.weight!) {
          // PR found, delete old PR and create new PR
          await deletePersonalRecord(db, previousPrSet.id!);
          await insertPersonalRecord(db, setData.id, setData.exercise_id);
        }
      }
      await db
        .update(schema.setsData)
        .set(setData)
        .where(eq(schema.setsData.id, setData.id));
      // We dont need any further actions here as we are setting state in our onChange event functions
      // and we are making use of the useLiveQuery hook from Drizzle ORM to listen for database changes
    };

    /**
     * Handles saving the time value from the child modal component.
     *
     * This function passes an updated copy of the state object to the `saveSet` function
     * which persists the changes to the database following its own checks.
     * It then updates the state with the new time value.
     *
     * @async
     * @param {number} val - The new time value to be saved.
     *
     * @returns {Promise<void>} A promise that resolves when the save operation is complete.
     */
    const handleTimeSave = async (val: number): Promise<void> => {
      const updatedState = { ...setData, time: val };
      await saveSet(updatedState);
      setSetData(updatedState);
    };

    /**
     * Handles the saving of distance data for a set.
     *
     * This function passes an updated copy of the state object to the `saveSet` function
     * which persists the changes to the database following its own checks.
     * It then updates the state with the new distance value.
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
      await saveSet(updatedState);
      setSetData(updatedState);
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
    const getPositon = (): Promise<{
      x: number;
      y: number;
      offset: number;
    }> => {
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
            onBlurFunc={async () => await saveSet(setData)}
            style={styles.inputStyles}
            focusStyle={styles.inputFocusStyles}
            selectionColor={"white"}
            suffix={setData.weight_unit}
          />
          <RepsInput
            value={setData.reps!.toString()}
            onChangeFunc={handleRepsChange()}
            onBlurFunc={async () => await saveSet(setData)}
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
            onBlurFunc={async () => await saveSet(setData)}
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
            onBlurFunc={async () => await saveSet(setData)}
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
            onBlurFunc={async () => await saveSet(setData)}
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
            onBlurFunc={async () => await saveSet(setData)}
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
          onBlurFunc={async () => await saveSet(setData)}
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
          onBlurFunc={async () => await saveSet(setData)}
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
        <Text style={styles.setNumber}>{setNumber}</Text>
        <Pressable
          onPress={() => eventEmitter.emit("notesModal", set.id, set.notes)}
          style={styles.justifyCenter}
        >
          <MaterialIcons
            name="speaker-notes"
            size={24}
            color={set.notes ? "#60DD49" : hexcodeLuminosity("#3F3C3C", 40)}
          />
        </Pressable>
        {/* Records indicator, not yet fully implemented */}
        {setData.personal_record ? (
          <Pressable
            onPress={() => console.log(setData.personal_record)}
            style={styles.setPrButton}
          >
            <MaterialCommunityIcons name="trophy" size={24} color="#60DD49" />
          </Pressable>
        ) : (
          <View style={styles.setPrButton} />
        )}
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
  },
  (prevProps, nextProps) => propsAreEqual(prevProps, nextProps)
);

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
