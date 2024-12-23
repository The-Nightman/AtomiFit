import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
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

  useEffect(() => {
    const onBackPress = () => {
      if (search) {
        // We want to clear the search results when the back button is pressed for android users, sometimes this is the expected behavior
        setSearch("");
        return true; // Prevent default back button behavior
      } else {
        return false; // Let the default back button behavior take over, not necessary but good semantics
      }
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [search]); // We need to add the search as a dep or else the listener will only have an image of the initial render state

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
