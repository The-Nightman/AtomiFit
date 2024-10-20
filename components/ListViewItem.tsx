import { ListWorkout } from "@/types/listView";
import { Set } from "@/types/sets";
import { displayDate } from "@/utils/displayDate";
import { distanceDisplay } from "@/utils/formatDistance";
import { formatTime } from "@/utils/formatTime";
import { setDisplayVariant } from "@/utils/setDisplayVariant";
import { memo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

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
    const { width } = Dimensions.get("screen"); // Get the screen width for styling reasons

    // Dictionary of display variants based on the keys of the set object
    const displayVariants: Record<string, (set: Set) => React.JSX.Element> = {
      weight_reps: (set: Set) => (
        <Text style={styles.text}>
          {set.weight} KG x {set.reps} REPS
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      distance_time: (set: Set) => (
        <Text style={styles.text}>
          {distanceDisplay(set.distance!)} - {formatTime(set.time!)}
          {set.notes && `  -  ${set.notes}`}11111111111111111111111111111111111111111111111111111111111
        </Text>
      ),
      weight_distance: (set: Set) => (
        <Text style={styles.text}>
          {set.weight} KG - {distanceDisplay(set.distance!)}
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      weight_time: (set: Set) => (
        <Text style={styles.text}>
          {set.weight} KG - {formatTime(set.time!)}
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      reps_distance: (set: Set) => (
        <Text style={styles.text}>
          {set.reps} REPS - {distanceDisplay(set.distance!)}
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      reps_time: (set: Set) => (
        <Text style={styles.text}>
          {set.reps} REPS x {formatTime(set.time!)}
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      weight: (set: Set) => (
        <Text style={styles.text}>
          {set.weight} KG{set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      reps: (set: Set) => (
        <Text style={styles.text}>
          {set.reps} REPS{set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      distance: (set: Set) => (
        <Text style={styles.text}>
          {distanceDisplay(set.distance!)}
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
      time: (set: Set) => (
        <Text style={styles.text}>
          {formatTime(set.time!)}
          {set.notes && `  -  ${set.notes}`}
        </Text>
      ),
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
                      // set maxWidth to the width of the screen minus margins
                      // and paddings (44) + extra for safety and readability
                      //! Test this on a smaller screen in android studio before merging into dev
                      <View key={set.id} style={{maxWidth:(width-64)}}>
                        {setDisplayVariant(set, displayVariants)}
                      </View>
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
  itemContainer: { flexDirection: "row", margin: 8 },
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
  exerciseContainer: { flexDirection: "row" },
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
