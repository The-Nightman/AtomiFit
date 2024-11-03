import { View, Text } from "react-native";
import { useContext } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import { Set } from "@/types/sets";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import ExerciseGraph from "@/components/ExerciseGraph";

/**
 * Graph component.
 * 
 * Component that renders an exercise graph based on the provided exercise ID.
 * It fetches exercise data from the database and displays the data in an ExerciseGraph component.
 * 
 * Not yet fully implemented.
 *
 * @returns {JSX.Element} A view containing the exercise graph or a message indicating no data is available.
 */
const graph = (): JSX.Element => {
  const { exerciseId } = useLocalSearchParams<{
    exerciseId: string;
  }>();
  const { db } = useContext(DrizzleContext);

  const { data }: { data: Set[] } = useLiveQuery(
    db
      .select()
      .from(schema.setsData)
      .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
      .orderBy(schema.setsData.date)
  );

  /**
   * Filters the input data to return the best set for each unique date.
   * The best set is determined by the highest product of weight and reps.
   *
   * @param {Set[]} data - An array of Set objects to be filtered.
   * @returns {Set[]} An array of Set objects, each representing the best set for a unique date.
   */
  const filterResults = (data: Set[]): Set[] => {
    // Reduce the data array to an object with unique dates as keys
    // Use Object.values to convert the object back into an array once the filtering is complete
    const filteredResults: Set[] = Object.values(
      data.reduce((acc, set) => {
        // If the date is not in acc or the current set has a higher sum of weight and reps
        if (
          !acc[set.date] ||
          acc[set.date].weight! * acc[set.date].reps! < set.weight! * set.reps!
        ) {
          // Add the date as a property and the current set as the best set for the date
          acc[set.date] = set;
        }
        return acc;
        // Initialize the accumulator as an empty object of type { [key: string]: Set }
        // This makes filtering more efficient with less code and easier to maintain
      }, {} as { [key: string]: Set })
    );

    return filteredResults;
  };

  return (
    <View style={{ flex: 1 }}>
      {data.length ? (
        <ExerciseGraph data={filterResults(data)} />
      ) : (
        <Text>No data to display</Text>
      )}
    </View>
  );
};

export default graph;
