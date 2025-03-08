import { DrizzleContext } from "@/contexts/drizzleContext";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import * as schema from "@/database/schema";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { Set } from "@/types/sets";

interface Data {
  exercise_name: string;
  sets_data: Set[];
}

interface ReducedData {
  [key: string]: Data;
}

interface QueryResult {
  exercise_name: string;
  sets_data: Set;
}

/**
 * Records component.
 *
 * This component is responsible for displaying the users personal records data in a psuedo table format.
 * This component makes use of a horizontal FlatList to display exercise names as headers and another
 * horizontal FlatList nested within a ScrollView to display the records for each exercise.
 * This component fetches data from the database using an asynchronous function
 * and processes it to display exercise records in a horizontal scrollable list.
 * The header FlatList is linked to the onScroll event of the main content Flatlist to keep them in
 * sync and has its own direct scrolling disabled.
 * The width of the elements adjusts dynamically to fill the screen based on the screen width and the
 * number of exercises.
 *
 * @returns {JSX.Element} The rendered component.
 */
const records = (): JSX.Element => {
  const [data, setData] = useState<Data[]>([]);
  const [elementWidth, setElementWidth] = useState(115);
  const { db } = useContext(DrizzleContext);
  const screenWidth = Dimensions.get("window").width;
  const headerScrollRef = useRef<FlatList>(null);
  const contentScrollRef = useRef<FlatList>(null);

  useEffect(() => {
    // useLiveQuery would be incredibily useless here as there will be no direct data
    // manipulation on this screen or its siblings for their expected lifecycle.
    const fetchData = async (): Promise<void> => {
      const recordsData: QueryResult[] = await db
        .select({
          exercise_name: schema.exercises.name,
          sets_data: schema.setsData,
        })
        .from(schema.setsData)
        .innerJoin(
          schema.exercises,
          eq(schema.setsData.exercise_id, schema.exercises.id)
        )
        .innerJoin(
          schema.personalRecords,
          eq(schema.setsData.id, schema.personalRecords.set_id)
        )

        .where(
          and(
            isNotNull(schema.setsData.weight),
            isNotNull(schema.setsData.reps),
            eq(schema.setsData.id, schema.personalRecords.set_id)
          )
        )
        .orderBy(asc(schema.exercises.name));

      const maxReps: number = Math.max(
        12, // Minimum threshold, this is for layout purposes
        ...recordsData.map((record) => record.sets_data.reps!)
      );

      const processedData = recordsData.reduce<ReducedData>(
        (acc: ReducedData, curr: QueryResult) => {
          if (!acc[curr.exercise_name]) {
            acc[curr.exercise_name] = {
              exercise_name: curr.exercise_name,
              sets_data: Array(maxReps).fill(null),
            };
          }

          if (curr.sets_data.reps) {
            const name = curr.exercise_name;
            const reps = curr.sets_data.reps;
            const existingSet = acc[name].sets_data[reps - 1];
            if (!existingSet) {
              acc[name].sets_data[reps - 1] = curr.sets_data;
            }
          }

          return acc;
        },
        {}
      );

      setData(() => {
        const dataToState = Object.values(processedData);

        // This will increase the width of elements to fill the screen if the
        // data is less than the screen width such as when the user applies a
        // filter to the exercises/categories or only exercises with data.
        if (dataToState.length * elementWidth < screenWidth) {
          setElementWidth(screenWidth / dataToState.length);
        } else {
          setElementWidth(115);
        }

        return dataToState;
      });
    };

    fetchData();
  }, []);

  /**
   * Handles the scroll event of the main content FlatList element and synchronizes the header header FlatList position.
   *
   * @param {NativeSyntheticEvent<NativeScrollEvent>} event - The native scroll event containing the current scroll position.
   * @returns {void}
   *
   * @remarks It is not possible to have a bi-directional link between the FlatLists as the scrollToOffset method
   * does will trigger the onScroll event of the header FlatList. This makes the FlatLists unuseable and extremely jittery.
   * As a result it is recommended to keep `scrollEnabled={false}` on the header FlatList and use this function on the main
   * content FlatList to synchronize the scroll position.
   */
  const handleContentScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollToOffset({
        offset: event.nativeEvent.contentOffset.x,
        animated: false,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {data.length > 0 ? (
        <>
          <View>
            <FlatList
              ref={headerScrollRef}
              horizontal
              data={data}
              keyExtractor={(item, index) => item.exercise_name + index}
              renderItem={({ item }: { item: Data }) => (
                <HeaderLabels
                  exerciseName={item.exercise_name}
                  elementWidth={elementWidth}
                />
              )}
              overScrollMode="never"
              bounces={false}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
          <ScrollView bounces={false} style={styles.scrollView}>
            <FlatList
              ref={contentScrollRef}
              horizontal
              data={data}
              keyExtractor={(item, index) => item.exercise_name + index}
              renderItem={({ item }: { item: Data }) => (
                <Records data={item} elementWidth={elementWidth} />
              )}
              onScroll={handleContentScroll}
              overScrollMode="never"
              bounces={false}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          </ScrollView>
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No data to display</Text>
        </View>
      )}
    </View>
  );
};

export default records;

/**
 * Renders a header label with specific styling.
 *
 * @param {string} exerciseName - The text content to be displayed in the header label.
 * @param {number} elementWidth - The width of the element to be rendered.
 * @returns {JSX.Element} A styled View component containing a Text component with the provided item.
 *
 * @remarks
 * The Text component has a `maxFontSizeMultiplier` set to 1 to preserve layout and prevent the screen from becoming too dense.
 * This is not ideal for accessibility, and future improvements may include zoomable view libraries.
 */
interface HeaderLabelsProps {
  exerciseName: string;
  elementWidth: number;
}

const HeaderLabels = ({
  exerciseName,
  elementWidth,
}: HeaderLabelsProps): JSX.Element => {
  return (
    <View
      style={[
        {
          width: elementWidth,
        },
        styles.headerContainer,
      ]}
    >
      <Text
        style={styles.headerText}
        // This is the exact opposite of ideal for accessibility but we do this
        // to preserve layout and prevent the screen from becoming too dense.
        // Will explore zoomable view libraries in the future.
        maxFontSizeMultiplier={1}
      >
        {exerciseName}
      </Text>
    </View>
  );
};

/**
 * Renders a column of records with specific styling.
 *
 * @param {string} data - The data to be displayed in the column consisting of personal records sets or nulls where no record exists for the rep range.
 * @param {number} elementWidth - The width of the element to be rendered.
 * @returns {JSX.Element} A styled View component containing a mapped column of Views holding the Text components with the provided data.
 *
 * @remarks
 * The Text component has a `maxFontSizeMultiplier` set to 1 to preserve layout and prevent the screen from becoming too dense.
 * This is not ideal for accessibility, and future improvements may include zoomable view libraries.
 */
interface RecordsProps {
  data: Data;
  elementWidth: number;
}

const Records = ({ data, elementWidth }: RecordsProps): JSX.Element => {
  return (
    <View
      style={[
        {
          width: elementWidth,
        },
        styles.recordsColumnContainer,
      ]}
    >
      {data.sets_data.map((record: Set, index: number) => {
        if (!record) {
          return (
            <View
              key={`${data.exercise_name}-no-data-${index}`}
              style={styles.recordContainer}
            >
              <Text
                style={[
                  {
                    color: hexcodeLuminosity("#FFFFFF", -150),
                  },
                  styles.recordDataText,
                ]}
                maxFontSizeMultiplier={1}
              >
                No Data
              </Text>
              <Text
                style={[
                  {
                    color: hexcodeLuminosity("#FFFFFF", -150),
                  },
                  styles.recordRepsText,
                ]}
                maxFontSizeMultiplier={1}
              >
                {index + 1} RM
              </Text>
            </View>
          );
        }
        return (
          <View
            key={`${data.exercise_name}-${record.id}`}
            style={styles.recordContainer}
          >
            <Text
              style={[
                {
                  color: "white",
                },
                styles.recordDataText,
              ]}
              maxFontSizeMultiplier={1}
            >
              {record.weight} {record.weight_unit!.toLocaleUpperCase()}
            </Text>
            <Text
              style={[
                {
                  color: "white",
                },
                styles.recordRepsText,
              ]}
              maxFontSizeMultiplier={1}
            >
              {record.reps} RM
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, flexDirection: "column" },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { fontSize: 23, color: "#B9B9B9" },
  scrollView: { flex: 1 },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 2,
    borderColor: "#3F3C3C",
  },
  headerText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    textAlignVertical: "center",
  },
  recordsColumnContainer: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#3F3C3C",
    gap: 4,
    padding: 8,
  },
  recordContainer: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  recordDataText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  recordRepsText: {
    fontSize: 17,
    textAlign: "center",
  },
});
