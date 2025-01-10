import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContext, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { and, eq, like } from "drizzle-orm";
import ExerciseListItem from "@/components/listItems/ExerciseListItem";
import SearchBar from "@/components/ux/SearchBar";
import { ScrollView } from "react-native-gesture-handler";
import UtilityStyles from "@/constants/UtilityStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

/**
 * CategoryExercises component that displays a list of exercises for a given category in the [category] route.
 *
 * This component fetches exercises from a database based on the category ID provided in the route.
 * It also provides search functionality to filter exercises within the category.
 * Each exercise is displayed in a list with a name and an options button.
 * Search functionality is also provided to query exercises within the category.
 *
 * @returns {JSX.Element} The rendered component.
 */
const CategoryExercises = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState<string>("");
  const { category, date } = useLocalSearchParams<{
    category: string;
    date: string;
  }>();
  const { db } = useContext(DrizzleContext);

  const { data } = useLiveQuery(
    db
      .select()
      .from(schema.exercises)
      .where(
        and(
          like(schema.exercises.name, `%${search}%`), // if the search term is empty this will return all exercises in the category
          eq(schema.exercises.category_id, Number(category))
        )
      ),
    [search]
  );

  return (
    <View style={UtilityStyles.flex1}>
      <SearchBar search={search} setSearch={setSearch} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
      >
        {data.map((exercise) => (
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
