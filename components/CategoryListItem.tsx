import { Pressable, StyleSheet, Text, View } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Category } from "@/types/categories";
import { router } from "expo-router";
import { eventEmitter } from "@/utils/eventEmitter";
import { useRef } from "react";

interface CategoryListItemProps {
  category: Category;
  date: string;
}

/**
 * Component representing a single category list item.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {Category} props.category - The category object containing details about the category.
 * @param {Date} props.date - The date associated with the category item.
 * @returns {JSX.Element} The rendered CategoryListItem component.
 *
 * @example
 * ```tsx
 * <CategoryListItem category={category} date={new Date()} />
 * ```
 */
const CategoryListItem = ({
  category,
  date,
}: CategoryListItemProps): JSX.Element => {
  const ListItemRef = useRef<View>(null);

  /**
   * Retrieves the position of the ListItemRef component.
   *
   * This function measures the position and dimensions of the ListItemRef component
   * and returns a Promise that resolves with an object containing the x and y coordinates
   * and an offset value. The offset value is half the height of the component, which is used
   * to properly offset the menu so that it does not begin halfway down the component.
   *
   * @returns {Promise<{ x: number, y: number, offset: number }>} A promise that resolves with an object containing the x and y coordinates and the offset value.
   */
  const getPositon = (): Promise<{ x: number; y: number; offset: number }> => {
    return new Promise((resolve) => {
      ListItemRef.current?.measure(
        (
          x: number,
          _y: number,
          _width: number,
          height: number,
          _pageX: number,
          pageY: number
        ) => {
          // We want to half the height of the component so we can properly offset
          // the menu otherwise the menu will begin halfway down the component
          resolve({ x: x - 20, y: pageY, offset: height / 2 });
        }
      );
    });
  };

  return (
    <Pressable
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
      ref={ListItemRef}
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
      <Pressable
        style={styles.menuButton}
        onPress={async () => {
          const position = await getPositon();
          eventEmitter.emit("categoryMenu", category.id, position);
        }}
      >
        <Entypo name="dots-three-vertical" size={28} color="#60DD49" />
      </Pressable>
    </Pressable>
  );
};

export default CategoryListItem;

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
