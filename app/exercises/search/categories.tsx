import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useContext, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import Entypo from "@expo/vector-icons/Entypo";
import SearchBar from "@/components/SearchBar";
import * as schema from "@/database/schema";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Category } from "@/types/categories";
import { like } from "drizzle-orm";
import { Exercise } from "@/types/exercise";
import ExerciseListItem from "@/components/ExerciseListItem";
import { router, useLocalSearchParams } from "expo-router";
import UtilityStyles from "@/constants/UtilityStyles";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import ExerciseMenu from "@/components/modals/ExerciseMenu";

/**
 * Categories component that displays a list of exercise categories.
 *
 * This component fetches categories from a database and displays them in a scrollable view.
 * Each category is displayed with a colored indicator, name, and an options button.
 * Search functionality is also provided to filter exercises at a global level meaning regardless of category.
 *
 * @returns {JSX.Element} The rendered Categories component.
 */
const categories = (): JSX.Element => {
  const [search, setSearch] = useState<string>("");
  const { db } = useContext(DrizzleContext);
  const { date } = useLocalSearchParams<{ date: string }>();

  const { data: categories } = useLiveQuery(
    db.select().from(schema.categories)
  );
  const { data: searchResults } = useLiveQuery(
    search
      ? db
          .select()
          .from(schema.exercises)
          .where(like(schema.exercises.name, `%${search}%`))
      : db.select().from(schema.exercises).limit(0),
    [search]
  );

  return (
    <View style={UtilityStyles.flex1}>
      <SearchBar search={search} setSearch={setSearch} />
      <ScrollView>
        {searchResults.length
          ? searchResults.map((exercise: Exercise) => (
              <ExerciseListItem
                key={exercise.id}
                exercise={exercise}
                search={search}
                date={date}
              />
            ))
          : categories.map((category: Category) => (
              <Pressable
                key={category.id}
                onPress={() =>
                  router.push({
                    pathname: "/exercises/search/[category]",
                    params: { category: category.id!, date: date },
                  })
                }
                style={({ pressed }) => [
                  styles.categoryListItem,
                  pressed && { backgroundColor: "#595555" },
                ]}
              >
                {/* indicator */}
                <View
                  style={[
                    styles.categoryIndicator,
                    {
                      backgroundColor: category.colour,
                      borderColor: hexcodeLuminosity(category.colour, 40),
                    },
                  ]}
                />
                <Text style={styles.categoryText}>{category.name}</Text>
                <Pressable style={styles.menuButton}>
                  <Entypo
                    name="dots-three-vertical"
                    size={28}
                    color="#60DD49"
                  />
                </Pressable>
              </Pressable>
            ))}
      </ScrollView>
      <ExerciseMenu />
    </View>
  );
};

export default categories;

const styles = StyleSheet.create({
  categoryListItem: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    borderColor: "#3F3C3C",
    borderBottomWidth: 1,
    paddingLeft: 12,
  },
  categoryIndicator: {
    height: 22,
    width: 22,
    alignSelf: "center",
    borderRadius: 11,
    borderWidth: 1.5,
  },
  categoryText: { flex: 1, color: "white", fontSize: 20, alignSelf: "center" },
  menuButton: {
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});

// exerciseListItem: {
//   minHeight: 44,
//   flexDirection: "row",
//   justifyContent: "space-between",
//   gap: 14,
//   borderColor: "#3F3C3C",
//   borderBottomWidth: 1,
//   paddingLeft: 12,
// },
// exerciseText: {
//   flex: 1,
//   alignSelf: "center",
//   color: "white",
//   fontSize: 20,
// },
// highlightedText: { fontWeight: "bold" },
// menuButton: {
//   minWidth: 44,
//   justifyContent: "center",
//   alignItems: "center",
// },
