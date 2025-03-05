import { DrizzleContext } from "@/contexts/drizzleContext";
import { Set, SetPersonalRecord } from "@/types/sets";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import * as schema from "@/database/schema";
import { asc, desc, eq } from "drizzle-orm";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HistoryListItem from "@/components/listItems/HistoryListItem";

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
  const insets = useSafeAreaInsets();
  const { exerciseId } = useLocalSearchParams<{
    exerciseId: string;
  }>();
  const { db } = useContext(DrizzleContext);

  const { data }: { data: SetPersonalRecord[] } = useLiveQuery(
    db
      .select({
        id: schema.setsData.id,
        exercise_id: schema.setsData.exercise_id,
        date: schema.setsData.date,
        weight: schema.setsData.weight,
        reps: schema.setsData.reps,
        distance: schema.setsData.distance,
        time: schema.setsData.time,
        notes: schema.setsData.notes,
        weight_unit: schema.setsData.weight_unit,
        distance_unit: schema.setsData.distance_unit,
        personal_record: schema.personalRecords,
      })
      .from(schema.setsData)
      .leftJoin(
        schema.personalRecords,
        eq(schema.setsData.id, schema.personalRecords.set_id)
      )
      .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
      .orderBy(desc(schema.setsData.date), asc(schema.setsData.id))
  );

  return (
    <>
      {data.length ? (
        <FlatList
          contentContainerStyle={[
            styles.container,
            { paddingBottom: insets.bottom },
          ]}
          data={
            // We want to process the data to group sets by date
            data.reduce<{ date: string; sets: SetPersonalRecord[] }[]>((acc, set) => {
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
          }
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => <HistoryListItem workoutItem={item} />}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No data to display</Text>
        </View>
      )}
    </>
  );
};

export default History;

const styles = StyleSheet.create({
  container: { gap: 12 },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { fontSize: 23, color: "#B9B9B9" },
});
