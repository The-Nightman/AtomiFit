import { DrizzleContext } from "@/contexts/drizzleContext";
import { Set } from "@/types/sets";
import { formatTime } from "@/utils/formatTime";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as schema from "@/database/schema";
import { desc, eq } from "drizzle-orm";
import { displayDate } from "@/utils/displayDate";
import { getToday } from "@/utils/getToday";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

interface TransformedHistoryData {
  date: string;
  sets: Set[];
}

/**
 * History component.
 * 
 * The history component displays the exercise history based on the exercise ID
 * passed through local route params. It queries the database sets_data table by
 * exercise ID and organizes it by date descending, displaying sets with different
 * configurations based on the set's properties using the setDisplayVariant function
 * and the displayVariants dictionary.
 *
 * @returns {React.JSX.Element} The rendered component.
 */
const History = (): React.JSX.Element => {
  const { exerciseId } = useLocalSearchParams<{
    exerciseId: string;
  }>();
  const { db } = useContext(DrizzleContext);

  const { data }: { data: Set[] } = useLiveQuery(
    db
      .select()
      .from(schema.setsData)
      .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
      .orderBy(desc(schema.setsData.date))
  );

  /**
   * Sets the set display variant based on the keys of the set object.
   *
   * @param {Set} set - The set object.
   * @returns {React.JSX.Element} The display variant element configuration.
   */
  const setDisplayVariant = (set: Set): React.JSX.Element => {
    // Dictionary of display variants based on the keys of the set object
    const displayVariants: Record<string, (set: Set) => React.JSX.Element> = {
      weight_reps: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
          </Text>
          <Text style={styles.setData}>
            {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
          </Text>
        </>
      ),
      distance_time: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.distance}
            <Text style={styles.setDataUnit}>Km</Text>
          </Text>
          <Text style={styles.setData}>{formatTime(set.time!)}</Text>
        </>
      ),
      weight_distance: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
          </Text>
          <Text style={styles.setData}>
            {set.distance}
            <Text style={styles.setDataUnit}>Km</Text>
          </Text>
        </>
      ),
      weight_time: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
          </Text>
          <Text style={styles.setData}>{formatTime(set.time!)}</Text>
        </>
      ),
      reps_distance: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
          </Text>
          <Text style={styles.setData}>
            {set.distance}
            <Text style={styles.setDataUnit}>Km</Text>
          </Text>
        </>
      ),
      reps_time: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
          </Text>
          <Text style={styles.setData}>{formatTime(set.time!)}</Text>
        </>
      ),
      weight: (set: Set) => (
        <Text style={styles.setData}>
          {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
        </Text>
      ),
      reps: (set: Set) => (
        <Text style={styles.setData}>
          {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
        </Text>
      ),
      distance: (set: Set) => (
        <Text style={styles.setData}>
          {set.distance}
          <Text style={styles.setDataUnit}>Km</Text>
        </Text>
      ),
      time: (set: Set) => (
        <Text style={styles.setData}>{formatTime(set.time!)}</Text>
      ),
    };
    // Define the keys to be checked in the set object
    const keys = ["weight", "reps", "distance", "time"];
    // Filter out nulls and return a string of the keys joined
    const displayKeys: string = keys
      .filter((key: string) => set[key as keyof Set] !== null)
      .join("_");
    // Return the display variant based on the result of the keys
    return displayVariants[displayKeys](set);
  };

  return (
    <View style={styles.container}>
      {data
        .reduce<TransformedHistoryData[]>((acc, set) => {
          const existingDate = acc.find((item) => item.date === set.date);

          if (existingDate) {
            existingDate.sets.push(set);
          } else {
            acc.push({
              date: set.date,
              sets: [set],
            });
          }

          return acc;
        }, [])
        .map((historyObj: TransformedHistoryData) => {
          return (
            <View key={historyObj.date} style={styles.workoutContainer}>
              <Text style={styles.exerciseDate}>
                {displayDate(historyObj.date, getToday())}
              </Text>
              <View>
                {historyObj.sets.map((set) => {
                  return (
                    <View key={set.id} style={styles.setDataContainer}>
                      <View style={styles.setNotesPersonalRecordContainer}>
                        {!set.notes ? (
                          // If notes is blank render a blank view to maintain layout
                          <View style={styles.setNotesPlaceholder} />
                        ) : (
                          <Pressable
                            onPress={() => console.log(set.notes)}
                            style={styles.justifyCenter}
                          >
                            <MaterialIcons
                              name="speaker-notes"
                              size={24}
                              color="#60DD49"
                            />
                          </Pressable>
                        )}
                        {/* Records indicator, not yet fully implemented but
                        required for layout */}
                        <Pressable
                          onPress={() => console.log("PR, not yet implemented")}
                          style={styles.setPrButton}
                        >
                          <MaterialCommunityIcons
                            name="trophy"
                            size={24}
                            color="#60DD49"
                          />
                        </Pressable>
                      </View>
                      <View style={styles.setDataSubContainer}>
                        {setDisplayVariant(set)}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
    </View>
  );
};

export default History;

const styles = StyleSheet.create({
  container: { gap: 12 },
  exerciseDate: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#60DD49",
  },
  workoutContainer: { paddingVertical: 8, paddingHorizontal: 20, gap: 8 },
  setDataContainer: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 8,
  },
  setNotesPersonalRecordContainer: { flexDirection: "row", flex: 0.5, gap: 16 },
  setNotesPlaceholder: { width: 24 },
  setPrButton: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  setDataSubContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  justifyCenter: { justifyContent: "center" },
  setData: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
    textAlign: "right",
    flex: 1,
  },
  setDataUnit: { color: "white", fontWeight: "normal", fontSize: 13 },
});
