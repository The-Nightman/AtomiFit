import { ListWorkout } from "@/types/listView";
import { Set } from "@/types/sets";
import { displayDate } from "@/utils/displayDate";
import { distanceDisplay } from "@/utils/formatDistance";
import { formatTime } from "@/utils/formatTime";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ListViewItemProps {
  workout: ListWorkout;
  today: string;
}

/**
 * Renders a single item in the ListView.
 *
 * @param {Object} props - The props for the ListViewItem component.
 * @param {ListWorkout} props.workout - The workout data to be displayed.
 * @param {string} props.today - The current date in yyyy-mm-dd string format.
 * @returns {JSX.Element} The rendered ListViewItem.
 */
const ListViewItem = memo(
  ({ workout, today }: ListViewItemProps): JSX.Element => {
    /**
     * Sets the set display variant based on the keys of the set object.
     *
     * @param {Set} set - The set object.
     * @returns {string} The display variant string.
     */
    const setDisplayVariant = (set: Set): string => {
      // Dictionary of display variants based on the keys of the set object
      const displayVariants: Record<string, (set: Set) => string> = {
        weight_reps: (set: Set) => `${set.weight} KG x ${set.reps} REPS`,
        distance_time: (set: Set) =>
          `${distanceDisplay(set.distance!)} - ${formatTime(set.time!)}`,
        weight_distance: (set: Set) =>
          `${set.weight} KG - ${distanceDisplay(set.distance!)}`,
        weight_time: (set: Set) =>
          `${set.weight} KG - ${formatTime(set.time!)}`,
        reps_distance: (set: Set) =>
          `${set.reps} REPS - ${distanceDisplay(set.distance!)}`,
        reps_time: (set: Set) => `${set.reps} REPS - ${formatTime(set.time!)}`,
        weight: (set: Set) => `${set.weight} KG`,
        reps: (set: Set) => `${set.reps} REPS`,
        distance: (set: Set) => `${distanceDisplay(set.distance!)}`,
        time: (set: Set) => `${formatTime(set.time!)}`,
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
      <View style={styles.itemContainer}>
        <View
          style={[
            workout.date === today
              ? { backgroundColor: "#60DD49" }
              : { backgroundColor: "gray" },
            styles.itemSideBar,
          ]}
        />
        <View>
          <View>
            <Text style={styles.headerText}>
              {displayDate(workout.date, today)}
            </Text>
            {workout.data.map((exercise) => (
              <View
                key={`${workout.date}-${exercise.exercise_name}`}
                style={styles.exerciseContainer}
              >
                <View
                  style={[
                    styles.exerciseCategoryMarker,
                    {
                      backgroundColor: exercise.category_colour,
                    },
                  ]}
                />
                <View>
                  <Text style={styles.exerciseName}>
                    {exercise.exercise_name.toUpperCase()}
                  </Text>
                  <View>
                    {exercise.sets.map((set: Set) => (
                      <Text
                        key={`${workout.data}-set${set.id}`}
                        style={styles.text}
                      >
                        {setDisplayVariant(set)}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.categoryContainer}>
            {workout.data
              // Remove duplicate categories
              .reduce(
                (
                  acc: { category_colour: string; category_name: string }[],
                  cat
                ) => {
                  if (
                    !acc.some(
                      (item) => item.category_name === cat.category_name
                    )
                  ) {
                    acc.push({
                      category_colour: cat.category_colour,
                      category_name: cat.category_name,
                    });
                  }
                  return acc;
                },
                []
              )
              // Map over the reduced categories and display the category name and colour with a marker
              .map(({ category_colour, category_name }) => (
                <View
                  key={`${workout.date}-${category_name}`}
                  style={styles.categoryItem}
                >
                  <View
                    style={[
                      styles.categoryMarker,
                      { backgroundColor: category_colour },
                    ]}
                  />
                  <Text style={{ color: category_colour }}>
                    {category_name}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </View>
    );
  }
);

export default ListViewItem;

const styles = StyleSheet.create({
  itemContainer: { display: "flex", flexDirection: "row", margin: 8 },
  itemSideBar: {
    width: 8,
    borderRadius: 4,
    marginRight: 8,
    // Use array styles to apply background colour [{ backgroundColor: "col" }]
  },
  headerText: {
    color: "white",
    fontSize: 34,
  },
  exerciseContainer: { display: "flex", flexDirection: "row" },
  exerciseCategoryMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 8,
    // Use array styles to apply background colour [{ backgroundColor: "col" }]
  },
  exerciseName: {
    color: "#60DD49",
    fontSize: 17,
    fontWeight: "600",
  },
  text: { color: "#B9B9B9" },
  categoryContainer: { flexDirection: "row", gap: 8 },
  categoryItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  categoryMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    // Use array styles to apply background colour [{ backgroundColor: "col" }]
  },
});
