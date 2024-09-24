import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import Entypo from "@expo/vector-icons/Entypo";
import SearchBar from "@/components/SearchBar";
import * as schema from "@/database/schema";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Category } from "@/types/categories";
import { like } from "drizzle-orm";
import { Exercise } from "@/types/exercise";
import ExerciseListItem from "@/components/ExerciseListItem";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const { db } = useContext(DrizzleContext);

  // Fetch categories from the database on mount
  useEffect(() => {
    const data: Category[] = db.select().from(schema.categories).all();
    setCategories(data);
  }, []);

  // Filter exercises based on the search
  useEffect(() => {
    // If search is empty, reset search results to show categories again and return early
    if (!search) {
      setSearchResults([]);
      return;
    }

    // Query database for exercises LIKE search term, better UX than matching from start of name
    const results: Exercise[] = db
      .select()
      .from(schema.exercises)
      .where(like(schema.exercises.name, `%${search}%`))
      .all();

    setSearchResults(results);
  }, [search]);

  return (
    <View>
      <SearchBar search={search} setSearch={setSearch} />
      <ScrollView>
        {searchResults.length // If search results exist, display them, otherwise display categories
          ? searchResults.map((exercise: Exercise) => (
              <ExerciseListItem key={exercise.id} exercise={exercise} />
            ))
          : categories.map((category: Category) => (
              <Pressable
                key={category.id}
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
                <Pressable>
                  <Entypo
                    name="dots-three-vertical"
                    size={28}
                    color="#60DD49"
                  />
                </Pressable>
              </Pressable>
            ))}
      </ScrollView>
    </View>
  );
};

export default categories;

const styles = StyleSheet.create({
  categoryListItem: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderColor: "#3F3C3C",
    borderBottomWidth: 1,
    paddingLeft: 12,
    paddingRight: 8,
  },
  categoryIndicator: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  categoryText: { flex: 1, color: "white", fontSize: 22 },
});
