import { Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import { useContext } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import * as schema from "@/database/schema";
import { and, eq, max } from "drizzle-orm";
import { Set } from "@/types/sets";
import TrackSetListItem from "@/components/listItems/TrackSetListItem";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SetMenu from "@/components/modals/SetMenu";

/**
 * Track component.
 *
 * Track component is responsible for displaying and managing exercise sets for a specific exercise.
 * It fetches the sets data from the database based on the exercise ID and the given date,
 * and displays them in a scrollable list. Users can add new sets using the provided button.
 *
 * @returns {JSX.Element} The rendered component.
 */
const Track = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const { exerciseId, exerciseType, weight_unit, date } = useLocalSearchParams<{
    exerciseId: string;
    exerciseType: string;
    weight_unit: "null" | "Kg" | "Lbs"; // see WeightUnit @/types/units, we we need to cast due to being a string url param
    date: string;
  }>();
  const { db } = useContext(DrizzleContext);

  // Fetch sets data from the database based on the exercise ID and passed date.
  // make use of useLiveQuery hook to watch for changes in the database.
  const { data }: { data: Set[] } = useLiveQuery(
    db
      .select()
      .from(schema.setsData)
      .where(
        and(
          // Cast exerciseId to number due to string nature of URL params
          eq(schema.setsData.exercise_id, Number(exerciseId)),
          eq(schema.setsData.date, date)
        )
      )
  );

  /**
   * Adds a new set to the exercise tracking state.
   *
   * If there are existing sets, it copies the most recent set, clears the notes, and removes the ID.
   * If there are no existing sets, it checks for the most recent workout date for the exercise.
   * - If no previous sets are found, it creates a blank set.
   * - If previous sets are found, it copies the first set from the most recent date.
   *
   * The new set is then inserted into the database and added to the state with the new ID.
   *
   * @returns {Promise<void>} A promise that resolves when the new set has been added.
   */
  const addNewSet = async (): Promise<void> => {
    // If there are sets copy the previous for user convenience
    if (data.length > 0) {
      // Copy the previous set, blank the notes and delete the id
      const newSet = { ...data[data.length - 1], notes: "" };
      delete newSet.id;
      // Insert the new set and return the id
      await db.insert(schema.setsData).values(newSet);

      return; // Return early
    }

    // If there are no sets, fetch the date of the most recent workout with the exercise or null
    const mostRecentDateQuery: { recentDate: string | null } | undefined = (
      await db
        .select({ recentDate: max(schema.setsData.date) })
        .from(schema.setsData)
        .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
    )[0];

    // If the most recent date query is false there are no previous sets
    // Therefore we create a blank set, otherwise we copy the previous set outside the block
    if (
      !mostRecentDateQuery ||
      !mostRecentDateQuery.recentDate ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        mostRecentDateQuery.recentDate
      )
    ) {
      // If there are no sets, create a blank set
      const setTemplates: {
        [key: string]: {
          weight: number | null;
          reps: number | null;
          distance: number | null;
          time: number | null;
        };
      } = {
        "Weight And Reps": { weight: 0, reps: 0, distance: null, time: null },
        "Distance And Time": { weight: null, reps: null, distance: 0, time: 0 },
        "Weight And Distance": {
          weight: 0,
          reps: null,
          distance: 0,
          time: null,
        },
        "Weight And Time": { weight: 0, reps: null, distance: null, time: 0 },
        "Reps And Distance": { weight: null, reps: 0, distance: 0, time: null },
        "Reps And Time": { weight: null, reps: 0, distance: null, time: 0 },
        Weight: { weight: 0, reps: null, distance: null, time: null },
        Reps: { weight: null, reps: 0, distance: null, time: null },
        Distance: { weight: null, reps: null, distance: 0, time: null },
        Time: { weight: null, reps: null, distance: null, time: 0 },
      };

      const newSet: Set = {
        exercise_id: Number(exerciseId),
        date: date,
        ...setTemplates[exerciseType],
        notes: "",
        weight_unit: weight_unit === "null" ? null : weight_unit,
        distance_unit: /distance/i.test(exerciseType) ? "Km" : null,
      };

      // Insert the new set
      await db.insert(schema.setsData).values(newSet);

      return; // Return early
    }

    // If there are past sets, copy the first set from the most recent date
    // This lets the user start with their warmup weight and reps
    // Or provides a reference for progressive overload
    const firstSetQuery: Set | undefined = (
      await db
        .select()
        .from(schema.setsData)
        .where(
          and(
            eq(schema.setsData.exercise_id, Number(exerciseId)),
            eq(schema.setsData.date, mostRecentDateQuery!.recentDate!)
          )
        )
        .orderBy(schema.setsData.id)
        .limit(1)
    )[0];

    // Return early if the query fails for some reason, at this point it should be gauranteed
    if (!firstSetQuery) return;

    // Copy the previous set, blank the notes, delete the id and set the date to the current selected date
    delete firstSetQuery.id;
    firstSetQuery.date = date;
    firstSetQuery.notes = "";

    // Insert the new set
    await db.insert(schema.setsData).values(firstSetQuery);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
    >
      {/* Mapped sets */}
      {data.map((set, i) => (
        <TrackSetListItem
          key={set.id || `newset-${i}`}
          set={set}
          setNumber={i}
        />
      ))}
      {/* Add set button */}
      <Pressable
        onPress={() => addNewSet()}
        style={({ pressed }) => [
          styles.addSetButton,
          pressed && {
            backgroundColor: hexcodeLuminosity(
              styles.addSetButton.backgroundColor,
              30
            ),
          },
        ]}
      >
        <MaterialIcons name="add" size={24} color="#60DD49" />
        <Text style={styles.addSetText}>ADD SET</Text>
      </Pressable>
      {/* Delete popup */}
      <SetMenu />
    </ScrollView>
  );
};

export default Track;

const styles = StyleSheet.create({
  container: { paddingTop: 20, gap: 16 },
  columnTitlesContainer: {
    flexDirection: "row",
    height: 36,
    justifyContent: "space-between",
    paddingHorizontal: 8,
    gap: 16,
  },
  columnTitleText: {
    color: "white",
    textAlign: "center",
    alignSelf: "center",
  },
  w24: { width: 24 },
  inputColumnTitleContainer: { flex: 1, flexDirection: "row", gap: 8 },
  inputColumnInnerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  inputColumnTitleText: { flex: 1, color: "white", textAlign: "center" },
  addSetButton: {
    flexDirection: "row",
    height: 44,
    backgroundColor: "#3F3C3C",
    marginHorizontal: 46,
    marginTop: 18,
    marginBottom: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addSetText: { color: "white", fontSize: 22 },
});
