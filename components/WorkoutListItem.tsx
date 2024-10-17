import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Set } from "@/types/sets";
import { router } from "expo-router";
import { formatTime } from "@/utils/formatTime";
import UtilityStyles from "@/constants/UtilityStyles";

interface WorkoutListItemProps {
  exercise: { exerciseId: number; exerciseName: string; sets: Set[] };
  date: string;
}

/**
 * Component that renders a list item for a workout to be used in the root screen, displaying exercise details and sets.
 * The component maps over the sets array in the exercise object to render each set, each set will conditionally display notes and personal records.
 * If notes are present an icon will be displayed to indicate this, if a personal record is present an icon will be displayed to indicate this.
 * Pressing either icon will open a modal to display and or edit the notes or display the personal records (Not yet implemented).
 * The component is a pressable container that navigates to the exercise screen when pressed.
 * The component uses the setDisplayVariant function to determine the display variant configuration of the set objects data.
 * The component uses the formatTime function to format the time data in the set objects.
 *
 * @component
 * @param {WorkoutListItemProps} props - The properties for the WorkoutListItem component.
 * @param {{ exerciseId: number; exerciseName: string; sets: Set[] }} props.exercise - The exercise object containing details about the exercise.
 * @param {string} props.date - The date of the workout.
 * @returns {React.JSX.Element} The rendered WorkoutListItem component.
 *
 * @example
 * <WorkoutListItem
 *   exercise={{
 *     exerciseId: '1',
 *     exerciseName: 'Bench Press',
 *     sets: [
 *       { id: '1', weight: 100, reps: 10, distance: null, time: null, notes: 'Felt strong' },
 *       { id: '2', weight: 105, reps: 8, distance: null, time: null, notes: '' },
 *     ],
 *   }}
 *   date="2023-10-01"
 * />
 */
const WorkoutListItem = ({
  exercise,
  date,
}: WorkoutListItemProps): React.JSX.Element => {
  /**
   * Sets the set display variant based on the keys of the set object.
   *
   * @param {Set} set - The set object.
   * @returns {React.JSX.Element} The display variant element configuration.
   */
  const setDisplayVariant = (set: Set): React.JSX.Element => {
    // Dictionary of display variants based on the keys of the set object
    const displayVariants: Record<string, (set: Set) => React.JSX.Element> = {
      weight_reps: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
          </Text>
          <Text style={styles.setData}>
            {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
          </Text>
        </>
      ),
      distance_time: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.distance}
            <Text style={styles.setDataUnit}>Km</Text>
          </Text>
          <Text style={styles.setData}>{formatTime(set.time!)}</Text>
        </>
      ),
      weight_distance: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
          </Text>
          <Text style={styles.setData}>
            {set.distance}
            <Text style={styles.setDataUnit}>Km</Text>
          </Text>
        </>
      ),
      weight_time: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
          </Text>
          <Text style={styles.setData}>{formatTime(set.time!)}</Text>
        </>
      ),
      reps_distance: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
          </Text>
          <Text style={styles.setData}>
            {set.distance}
            <Text style={styles.setDataUnit}>Km</Text>
          </Text>
        </>
      ),
      reps_time: (set: Set) => (
        <>
          <Text style={styles.setData}>
            {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
          </Text>
          <Text style={styles.setData}>{formatTime(set.time!)}</Text>
        </>
      ),
      weight: (set: Set) => (
        <Text style={styles.setData}>
          {set.weight} <Text style={styles.setDataUnit}>Kg</Text>
        </Text>
      ),
      reps: (set: Set) => (
        <Text style={styles.setData}>
          {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
        </Text>
      ),
      distance: (set: Set) => (
        <Text style={styles.setData}>
          {set.distance}
          <Text style={styles.setDataUnit}>Km</Text>
        </Text>
      ),
      time: (set: Set) => (
        <Text style={styles.setData}>{formatTime(set.time!)}</Text>
      ),
    };
    // Define the keys to be checked in the set object
    const keys = ["weight", "reps", "distance", "time"];
    // Filter out nulls and return a string of the keys joined
    const displayKeys: string = keys
      .filter((key: string) => set[key as keyof Set] !== null)
      .join("_");
    // Return the display variant based on the result of the keys
    return displayVariants[displayKeys](set);
  };

  return (
    <Pressable
      style={styles.itemContainer}
      onPress={() =>
        router.push({
          pathname: "/exercise/[exerciseId]",
          params: { exerciseId: exercise.exerciseId, date: date },
        })
      }
    >
      <View style={[{ backgroundColor: "#60DD49" }, styles.itemSideBar]} />
      <View style={UtilityStyles.flex1}>
        <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
        <View>
          {exercise.sets.map((set: Set) => (
            <View key={set.id} style={styles.setDataContainer}>
              <View style={styles.setNotesPersonalRecordContainer}>
                {!set.notes ? (
                  // If notes is blank render a blank view to maintain layout
                  <View style={styles.setNotesPlaceholder} />
                ) : (
                  <Pressable
                    onPress={() => console.log(set.notes)}
                    style={styles.justifyCenter}
                  >
                    <MaterialIcons
                      name="speaker-notes"
                      size={24}
                      color="#60DD49"
                    />
                  </Pressable>
                )}
                {/* Records indicator, not yet fully implemented but required for layout */}
                <Pressable
                  onPress={() => console.log("PR, not yet implemented")}
                  style={styles.setPrButton}
                >
                  <MaterialCommunityIcons
                    name="trophy"
                    size={24}
                    color="#60DD49"
                  />
                </Pressable>
              </View>
              <View style={styles.setDataSubContainer}>
                {setDisplayVariant(set)}
              </View>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
};

export default WorkoutListItem;

const styles = StyleSheet.create({
  itemContainer: { flexDirection: "row" },
  itemSideBar: {
    width: 8,
    borderRadius: 4,
    marginRight: 8,
    // Use array styles to apply background colour [{ backgroundColor: "col" }]
  },
  exerciseName: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  setDataContainer: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 8,
  },
  setNotesPersonalRecordContainer: { flexDirection: "row", flex: 0.5, gap: 16 },
  setNotesPlaceholder: { width: 24 },
  setPrButton: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  setDataSubContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  justifyCenter: { justifyContent: "center" },
  setData: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
    textAlign: "right",
    flex: 1,
  },
  setDataUnit: { color: "white", fontWeight: "normal", fontSize: 13 },
});
