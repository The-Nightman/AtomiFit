import { Exercise } from "@/types/exercise";
import { eventEmitter } from "@/utils/eventEmitter";
import { Entypo } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import { Text, Pressable, StyleSheet, View } from "react-native";

interface ExerciseListItemProps {
  exercise: Exercise;
  search: string;
  date: string;
}

/**
 * Component representing a single item in an exercise list on the browse screens.
 * 
 * The component navigates to the exercise screen via the replace method on press.
 *
 * @component
 * @param {ExerciseListItemProps} props - The properties for the component.
 * @param {Exercise} props.exercise - The exercise object containing details to display.
 * @param {string} props.search - The search term to highlight in the exercise name.
 * @param {string} props.date - The date to pass to the exercise screen.
 *
 * @returns {JSX.Element} A pressable list item displaying the exercise name and an options icon.
 */
const ExerciseListItem = ({
  exercise,
  search,
  date,
}: ExerciseListItemProps): JSX.Element => {
  const ListItemRef = useRef<View>(null);

  /**
   * Highlights occurrences of a specified substring within a given string.
   *
   * @param {string} text - The text in which to highlight the substring.
   * @param {string} highlight - The substring to highlight within the text.
   *
   * @returns {JSX.Element} A JSX element containing the text with highlighted substrings.
   */
  const getHighlightedText = (text: string, highlight: string): JSX.Element => {
    // Escape special characters in the highlight string to prevent regex errors
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Split the text into parts based on the highlight string
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    return (
      <Text style={styles.exerciseText}>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

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
        // We need to use replace for the navigation behavior we want, for some reason certain router methods are not available?
        router.replace({
          pathname: "/exercise/[exerciseId]/track",
          params: { exerciseId: exercise.id, date: date },
        })
      }
      style={({ pressed }) => [
        styles.exerciseListItem,
        pressed && { backgroundColor: "#595555" },
      ]}
      ref={ListItemRef}
    >
      {getHighlightedText(exercise.name, search)}
      <Pressable
        style={styles.menuButton}
        onPress={async () => {
          const position = await getPositon();
          eventEmitter.emit("exerciseMenu", exercise.id, position);
        }}
      >
        <Entypo name="dots-three-vertical" size={28} color="#60DD49" />
      </Pressable>
    </Pressable>
  );
};

export default ExerciseListItem;

const styles = StyleSheet.create({
  exerciseListItem: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    borderColor: "#3F3C3C",
    borderBottomWidth: 1,
    paddingLeft: 12,
  },
  exerciseText: {
    flex: 1,
    alignSelf: "center",
    color: "white",
    fontSize: 20,
  },
  highlightedText: { fontWeight: "bold" },
  menuButton: {
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
