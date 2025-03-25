import { DrizzleContext } from "@/contexts/drizzleContext";
import { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as schema from "@/database/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { ListWorkout, ListWorkoutExercise } from "@/types/listView";
import { FlatList } from "react-native-gesture-handler";
import ListViewItem from "@/components/listItems/ListViewItem";
import { getToday } from "@/utils/getToday";
import { DistanceUnit, WeightUnit } from "@/types/units";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Category } from "@/types/categories";
import { eventEmitter } from "@/utils/eventEmitter";
import { Storage } from "expo-sqlite/kv-store";

interface QueryResult {
  id: number;
  date: string;
  exercise_name: string | null;
  category_name: string | null;
  category_colour: string | null;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  time: number | null;
  notes: string | null;
  weight_unit: WeightUnit;
  distance_unit: DistanceUnit;
  exercise_id: number;
}

/**
 * ListView component displays a list of workouts grouped by date.
 * It queries the database for workout data and formats it into an array of ListWorkout type.
 * If there is no workout data for today, it renders a placeholder element.
 *
 * @returns {JSX.Element} The ListView component.
 */
const ListView = (): JSX.Element => {
  const { bottom } = useSafeAreaInsets();
  const [data, setData] = useState<ListWorkout[]>([]);
  const [filters, setFilters] = useState<Category["id"][]>([]);
  const [preferences, setPreferences] = useState<{
    timelineCategoryMarkers: boolean;
  }>({
    timelineCategoryMarkers: true,
  });
  const { db } = useContext(DrizzleContext);
  const listViewRef = useRef<FlatList<ListWorkout>>(null);
  const today = getToday(); // Get the current date

  useEffect(() => {
    eventEmitter.on("categoryFilterChange", (filter) => {
      setFilters(filter);
    });

    return () => {
      eventEmitter.off("categoryFilterChange", (filter) => {
        setFilters(filter);
      });
    };
  }, []);

  useEffect(() => {
    const getPrefs = async () => {
      const savedTimelinePrefs: string | null = await Storage.getItem(
        "timelineCategoryMarkers"
      );

      setPreferences({
        timelineCategoryMarkers: savedTimelinePrefs === "true",
      });
    };

    eventEmitter.on("timelinePreferenceChange", () => getPrefs());

    return () => {
      eventEmitter.off("timelinePreferenceChange", () => getPrefs());
    };
  }, []);

  useEffect(() => {
    const scrollToToday = () => {
      const index = data.findIndex((item) => item.date === today);
      if (index !== -1 && listViewRef.current) {
        listViewRef.current.scrollToIndex({
          index,
          viewOffset: 8,
          animated: true,
        });
      }
    };

    eventEmitter.on("calendarReturnToToday", () => scrollToToday());

    return () => {
      eventEmitter.off("calendarReturnToToday", () => scrollToToday());
    };
  }, [data]);

  useEffect(() => {
    const initPrefs = async () => {
      const savedTimelinePrefs: string | null = await Storage.getItem(
        "timelineCategoryMarkers"
      );

      // We dont need to directly save preferences to kv store here as we are doing that in the layout
      if (savedTimelinePrefs === null) {
        setPreferences({
          timelineCategoryMarkers: true,
        });
      } else {
        setPreferences({
          timelineCategoryMarkers: savedTimelinePrefs === "true",
        });
      }
    };

    initPrefs();
  }, []);

  useEffect(() => {
    /**
     * Fetches workout data from the database, processes it into a structured format,
     * and updates the state with the processed data. The data is grouped by date and
     * then sub-grouped by exercise. If there is no data for today, a placeholder element
     * is added.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the data has been fetched and processed.
     */
    const fetchData = async (): Promise<void> => {
      const data: QueryResult[] = await db
        .select({
          id: schema.setsData.id,
          date: schema.setsData.date,
          exercise_name: schema.exercises.name,
          category_name: schema.categories.name,
          category_colour: schema.categories.colour,
          weight: schema.setsData.weight,
          reps: schema.setsData.reps,
          distance: schema.setsData.distance,
          time: schema.setsData.time,
          notes: schema.setsData.notes,
          weight_unit: schema.setsData.weight_unit,
          distance_unit: schema.setsData.distance_unit,
          exercise_id: schema.setsData.exercise_id,
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
        .where(
          filters.length > 0
            ? inArray(
                schema.setsData.date,
                db
                  .select({ dates: schema.setsData.date })
                  .from(schema.setsData)
                  .leftJoin(
                    schema.exercises,
                    eq(schema.setsData.exercise_id, schema.exercises.id)
                  )
                  .leftJoin(
                    schema.categories,
                    eq(schema.exercises.category_id, schema.categories.id)
                  )
                  .where(inArray(schema.categories.id, filters as number[]))
              )
            : undefined
        )
        .orderBy(desc(schema.setsData.date), asc(schema.setsData.id));

      // Process the data into the ListWorkout type grouping by date and then sub-group by exercise
      const processedData = data.reduce<ListWorkout[]>((acc, item) => {
        const dateGroup: ListWorkout | undefined = acc.find(
          (accItem) => accItem.date === item.date
        );
        // Check if the date group exists in the accumulator
        if (dateGroup) {
          const exerciseGroup: ListWorkoutExercise | undefined =
            dateGroup.data.find(
              (dateItem) => dateItem.exercise_name === item.exercise_name
            );
          // If date group exists, check if the exercise group exists in the date group
          if (exerciseGroup) {
            exerciseGroup.sets.push({
              id: item.id,
              weight: item.weight,
              reps: item.reps,
              distance: item.distance,
              time: item.time,
              notes: item.notes,
              weight_unit: item.weight_unit,
              distance_unit: item.distance_unit,
              date: item.date,
              exercise_id: item.exercise_id,
            });
            // If exercise group does not exist, create a new exercise group and add the set
          } else {
            dateGroup.data.push({
              exercise_name: item.exercise_name!,
              category_name: item.category_name!,
              category_colour: item.category_colour!,
              sets: [
                {
                  id: item.id,
                  weight: item.weight,
                  reps: item.reps,
                  distance: item.distance,
                  time: item.time,
                  notes: item.notes,
                  weight_unit: item.weight_unit,
                  distance_unit: item.distance_unit,
                  date: item.date,
                  exercise_id: item.exercise_id,
                },
              ],
            });
          }
          // If date group does not exist, create a new date group and exercise group and add the set
        } else {
          acc.push({
            date: item.date,
            data: [
              // Exercise group object
              {
                exercise_name: item.exercise_name!,
                category_name: item.category_name!,
                category_colour: item.category_colour!,
                sets: [
                  // Set object
                  {
                    id: item.id,
                    weight: item.weight,
                    reps: item.reps,
                    distance: item.distance,
                    time: item.time,
                    notes: item.notes,
                    weight_unit: item.weight_unit,
                    distance_unit: item.distance_unit,
                    date: item.date,
                    exercise_id: item.exercise_id,
                  },
                ],
              },
            ],
          });
        }

        return acc;
      }, []);

      // Check if there is data for today, if not add a placeholder element
      if (!processedData.some((item) => item.date === today)) {
        setData(() => {
          // If there is no data for today, add a placeholder element and sort
          const data = [...processedData, { date: today, data: [] }].sort(
            (a, b) => {
              // Sort the data by date descending, we use getTime() to compare the dates as integers
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
          );
          // Return the data to state
          return data;
        });
      } else {
        setData(processedData);
      }
    };

    fetchData();
  }, [filters]);

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
      return <ListViewItem workout={item} today={today} preferences={preferences} />;
    }
  };

  return (
    <FlatList
      ref={listViewRef}
      data={data}
      keyExtractor={(item) => item.date}
      renderItem={({ item }) => renderItem(item)}
      contentContainerStyle={{
        paddingTop: 16,
        paddingBottom: bottom ? bottom : 16,
        gap: 16,
      }}
    />
  );
};

export default ListView;

const styles = StyleSheet.create({
  placeholderContainer: {
    display: "flex",
    flexDirection: "row",
    marginLeft: 8,
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
