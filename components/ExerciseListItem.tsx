import { Exercise } from "@/types/exercise";
import { Entypo } from "@expo/vector-icons";
import { Text, Pressable, StyleSheet } from "react-native";

interface ExerciseListItemProps {
  exercise: Exercise;
}

/**
 * Component representing a single item in an exercise list on the browse screens.
 *
 * @param {ExerciseListItemProps} props - The properties for the component.
 * @param {Exercise} props.exercise - The exercise object containing details to display.
 * 
 * @returns {JSX.Element} A pressable list item displaying the exercise name and an options icon.
 */
const ExerciseListItem = ({ exercise }: ExerciseListItemProps): JSX.Element => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.exerciseListItem,
        pressed && { backgroundColor: "#595555" },
      ]}
    >
      <Text style={styles.exerciseText}>{exercise.name}</Text>
      <Pressable>
        <Entypo name="dots-three-vertical" size={28} color="#60DD49" />
      </Pressable>
    </Pressable>
  );
};

export default ExerciseListItem;

const styles = StyleSheet.create({
  exerciseListItem: {
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
  exerciseText: { flex: 1, color: "white", fontSize: 22 },
});
