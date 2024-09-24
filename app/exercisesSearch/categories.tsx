import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import Entypo from "@expo/vector-icons/Entypo";
import SearchBar from "@/components/SearchBar";
import * as schema from "@/database/schema";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Category } from "@/types/categories";

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
  const { db } = useContext(DrizzleContext);

  useEffect(() => {
    const data: Category[] = db.select().from(schema.categories).all();
    setCategories(data);
  }, []);

  return (
    <View>
      <SearchBar search={search} setSearch={setSearch} />
      <ScrollView>
        {categories.map((category: Category) => (
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
              <Entypo name="dots-three-vertical" size={28} color="#60DD49" />
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
