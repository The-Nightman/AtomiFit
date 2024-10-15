import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { and, eq, like } from "drizzle-orm";
import ExerciseListItem from "@/components/ExerciseListItem";
import SearchBar from "@/components/SearchBar";
import { Exercise } from "@/types/exercise";
import { ScrollView } from "react-native-gesture-handler";
import UtilityStyles from "@/constants/UtilityStyles";

/**
 * Dynamic route [category] component that displays a list of exercises for a given category.
 *
 * This component fetches exercises from a database based on the category ID provided in the route.
 * It also provides search functionality to filter exercises within the category.
 * Each exercise is displayed in a list with a name and an options button.
 * Search functionality is also provided to query exercises within the category.
 *
 * @returns {JSX.Element} The rendered component.
 */
const CategoryExercises = (): JSX.Element => {
  // One less state is declared here compared to categories.tsx as the list will only use one possible type and component.
  // This should reduce re-renders and improve net performance despite it being a small component.
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState<string>("");
  const { category, date } = useLocalSearchParams<{
    category: string;
    date: string;
  }>();
  const { db } = useContext(DrizzleContext);

  // Fetch exercises from the database based on the category ID provided in the route
  useEffect(() => {
    const data: Exercise[] = db
      .select()
      .from(schema.exercises)
      .where(eq(schema.exercises.category_id, Number(category)))
      .all();

    setExercises(data);
  }, []);

  // Filter exercises based on the search
  useEffect(() => {
    // If search is empty, reset exercises to show all exercises in the category and return early
    if (!search) {
      const data: Exercise[] = db
        .select()
        .from(schema.exercises)
        .where(eq(schema.exercises.category_id, Number(category)))
        .all();

      setExercises(data);
      return;
    }

    // Query database for exercises LIKE search term, use % wildcards to match any part of the name for better UX
    const results: Exercise[] = db
      .select()
      .from(schema.exercises)
      .where(
        and(
          like(schema.exercises.name, `%${search}%`),
          eq(schema.exercises.category_id, Number(category))
        )
      )
      .all();

    setExercises(results);
  }, [search]);

  return (
    <View style={UtilityStyles.flex1}>
      <SearchBar search={search} setSearch={setSearch} />
      <ScrollView>
        {exercises.map((exercise) => (
          <ExerciseListItem
            key={exercise.id}
            exercise={exercise}
            search={search}
            date={date}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryExercises;
