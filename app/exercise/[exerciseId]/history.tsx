import { DrizzleContext } from "@/contexts/drizzleContext";
import { Set } from "@/types/sets";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import * as schema from "@/database/schema";
import { desc, eq } from "drizzle-orm";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HistoryListItem from "@/components/HistoryListItem";

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

  const { data }: { data: Set[] } = useLiveQuery(
    db
      .select()
      .from(schema.setsData)
      .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
      .orderBy(desc(schema.setsData.date))
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
            data.reduce<{ date: string; sets: Set[] }[]>((acc, set) => {
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
