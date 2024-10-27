import { DrizzleContext } from "@/contexts/drizzleContext";
import { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as schema from "@/database/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ListWorkout } from "@/types/listView";
import { FlatList } from "react-native-gesture-handler";
import ListViewItem from "@/components/ListViewItem";
import { Set } from "@/types/sets";
import { getToday } from "@/utils/getToday";

interface QueryResult {
  date: string;
  exercise_name: string;
  category_name: string;
  category_colour: string;
  sets: string;
}

/**
 * ListView component displays a list of workouts grouped by date.
 * It queries the database for workout data and formats it into an array of ListWorkout type.
 * If there is no workout data for today, it renders a placeholder element.
 *
 * @returns {JSX.Element} The ListView component.
 */
const ListView = (): JSX.Element => {
  const [data, setData] = useState<ListWorkout[]>([]);
  const { db } = useContext(DrizzleContext);

  const today = getToday(); // Get the current date

  useEffect(() => {
    // Query the database for the data
    const data: QueryResult[] = db
      .select({
        date: schema.setsData.date,
        exercise_name: schema.exercises.name,
        category_name: schema.categories.name,
        category_colour: schema.categories.colour,
        sets: sql`'[' || GROUP_CONCAT(
          JSON_OBJECT(
          'id', sets_data.id,
          'weight', sets_data.weight,
          'reps', sets_data.reps,
          'distance', sets_data.distance,
          'time', sets_data.time,
          'notes', sets_data.notes
          )
        ) || ']' AS sets`,
      })
      .from(schema.setsData)
      .leftJoin(
        schema.exercises,
        eq(schema.setsData.exercise_id, schema.exercises.id)
      )
      .leftJoin(
        schema.categories,
        eq(schema.exercises.category_id, schema.categories.id)
      )
      .groupBy(
        schema.setsData.date,
        schema.exercises.name,
        schema.categories.name,
        schema.categories.colour
      )
      .orderBy(desc(schema.setsData.date))
      .all() as unknown as QueryResult[];

    // Group the data by date
    const groupedData = data.reduce(
      (
        acc: {
          [key: string]: {
            exercise_name: string;
            category_name: string;
            category_colour: string;
            sets: Set[];
          }[];
        },
        item
      ) => {
        const date: string = item.date;
        const sets: Set[] = JSON.parse(item.sets);

        // If the date object doesn't exist in the acc initialize it
        if (!acc[date]) {
          acc[date] = [];
        }

        // Push the data into the object
        acc[date].push({
          exercise_name: item.exercise_name,
          category_name: item.category_name,
          category_colour: item.category_colour,
          sets: sets,
        });

        // Sort the data by the first set id
        // This guarantees that the data is sorted by the order it was logged by user
        acc[date].sort((a, b) => {
          const firstSetA: number = a.sets[0].id!;
          const firstSetB: number = b.sets[0].id!;
          return firstSetA - firstSetB;
        });

        return acc;
      },
      {}
    );

    // Format the data into the an array of the ListWorkout type
    const formattedData: ListWorkout[] = Object.keys(groupedData).map(
      (date: string) => ({
        date: date,
        data: groupedData[date],
      })
    );

    // Check if there is data for today
    if (!formattedData.some((item) => item.date === today)) {
      setData(() => {
        // If there is no data for today, add a placeholder element and sort
        const data = [...formattedData, { date: today, data: [] }].sort(
          (a, b) => {
            // Sort the data by date descending, we use getTime() to compare the dates as integers
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
        );
        // Return the data to state
        return data;
      });
    } else {
      setData(formattedData);
    }
  }, []);

  /**
   * Render the list item elements for the listview.
   * 
   * Renders a placeholder element if the item date property is the current date
   * and data array is empty. Renders the ListViewItem component otherwise.
   *
   * @param {ListWorkout} item The workout item in the data array.
   * @returns {JSX.Element} The JSX.Element of the placeholder or null if no placeholder is needed.
   */
  const renderItem = (item: ListWorkout): JSX.Element => {
    if (item.date === today && item.data.length === 0) {
      return (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderSidebar} />
          <View>
            <View>
              <Text style={styles.headerText}>TODAY</Text>
            </View>
            <View style={styles.placeholderSubcontainer}>
              <Text style={styles.text}>
                No workouts currently logged today
              </Text>
              <Text style={styles.text}>Tap to start logging your workout</Text>
            </View>
          </View>
        </View>
      );
    } else {
      return <ListViewItem workout={item} today={today} />;
    }
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.date}
      renderItem={({ item }) => renderItem(item)}
    />
  );
};

export default ListView;

const styles = StyleSheet.create({
  placeholderContainer: {
    display: "flex",
    flexDirection: "row",
    margin: 8,
    height: 100,
  },
  placeholderSidebar: {
    width: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "#60DD49",
  },
  placeholderSubcontainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerText: {
    color: "white",
    fontSize: 34,
  },
  exerciseName: {
    color: "#60DD49",
    fontSize: 17,
    fontWeight: "600",
  },
  text: { color: "#B9B9B9" },
});
