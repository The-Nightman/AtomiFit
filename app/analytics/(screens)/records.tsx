import { DrizzleContext } from "@/contexts/drizzleContext";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import * as schema from "@/database/schema";
import { and, asc, eq, exists, isNotNull } from "drizzle-orm";
import { Set } from "@/types/sets";
import { ExerciseTypes } from "@/types/exercise";
import Animated, {
  ScrollHandlerProcessed,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { eventEmitter } from "@/utils/eventEmitter";
import { router, useLocalSearchParams } from "expo-router";
import AndroidRecordsFilterModal from "@/components/modals/AndroidRecordsFilterModal";
import LoadingIndicator from "@/components/ux/LoadingIndicator";

interface Data {
  exercise_name: string;
  sets_data: Set[];
}

interface ReducedData {
  [key: string]: Data;
}

interface QueryResult {
  exercise_name: string;
  sets_data: Set | null;
}

interface Options {
  catPickerData: { id: number; name: string }[];
  categoryFilter: "all" | number;
  typeFilter: ExerciseTypes;
  hideEmpty: boolean;
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
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Options>({
    catPickerData: [],
    categoryFilter: "all",
    typeFilter: "Weight And Reps",
    hideEmpty: false,
  });
  const [elementWidth, setElementWidth] = useState(120);
  const [data, setData] = useState<Data[]>([]);
  const screenWidth = Dimensions.get("window").width;
  const scrollX = useSharedValue(0);
  const contentScrollRef = useRef<FlatList>(null);
  const { db } = useContext(DrizzleContext);
  const { filters } = useLocalSearchParams<{ filters: string }>();

  // This effect loop will run for iOS users only when setting filters from the associated modal route
  useEffect(() => {
    if (filters) {
      const {
        categoryFilter,
        typeFilter,
        hideEmpty,
      }: {
        categoryFilter: Options["categoryFilter"];
        typeFilter: Options["typeFilter"];
        hideEmpty: Options["hideEmpty"];
      } = JSON.parse(filters);
      setOptions({
        ...options,
        categoryFilter:
          categoryFilter === "all"
            ? "all"
            : parseInt(categoryFilter as unknown as "all" | string), // Int values will be a string since they were passed through the router
        typeFilter,
        hideEmpty,
      });
    }
  }, [filters]);

  useEffect(() => {
    eventEmitter.on("openiOSRecordsFilterModal", () => {
      router.push({
        pathname: "/analytics/iOSRecordsFiltersModal",
        params: {
          options: JSON.stringify(options),
        },
      });
    });

    return () => {
      eventEmitter.off("openiOSRecordsFilterModal", () => {
        router.push({
          pathname: "/analytics/iOSRecordsFiltersModal",
          params: {
            options: JSON.stringify(options),
          },
        });
      });
    };
  }, [
    options.catPickerData,
    options.categoryFilter,
    options.typeFilter,
    options.hideEmpty,
  ]);

  useEffect(() => {
    const fetchCategoriesData = async (): Promise<void> => {
      const categories = await db
        .select({ id: schema.categories.id, name: schema.categories.name })
        .from(schema.categories);

      setOptions({
        ...options,
        catPickerData: categories,
      });
    };

    fetchCategoriesData();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoading(true);
    }

    // Reset the scroll position on filter change, this is to prevent the content
    // from being off the screen when the user changes the filter options
    scrollX.value = 0;
    contentScrollRef.current?.scrollToOffset({ offset: 0, animated: false });

    // We use this incase no results are returned from the database i.e. an exercise doesnt exist
    // for the filtered type. This should be an effectively rare case but there is no way to improve
    // the performance and still achieve the same result without harming the UX of the screen
    const catchTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 3000);

    // useLiveQuery would be incredibily useless here as there will be no direct data
    // manipulation on this screen or its siblings for their expected lifecycle.
    const fetchData = async (): Promise<void> => {
      const recordsData: QueryResult[] = await db
        .select({
          exercise_name: schema.exercises.name,
          sets_data: schema.setsData,
        })
        .from(schema.exercises)
        .leftJoin(
          schema.setsData,
          and(
            eq(schema.setsData.exercise_id, schema.exercises.id),
            exists(
              db
                .select()
                .from(schema.personalRecords)
                .where(eq(schema.personalRecords.set_id, schema.setsData.id))
            )
          )
        )
        .where(
          and(
            eq(schema.exercises.type, options.typeFilter),
            options.categoryFilter === "all"
              ? undefined
              : eq(schema.exercises.category_id, options.categoryFilter),
            options.hideEmpty ? isNotNull(schema.setsData.id) : undefined
          )
        )
        .orderBy(asc(schema.exercises.name));

      const maxReps: number = Math.max(
        12, // Minimum threshold, this is for layout purposes
        ...recordsData
          .map((record) => record.sets_data?.reps)
          .filter((reps): reps is number => reps !== undefined)
      );

      const processedData = recordsData.reduce<ReducedData>(
        (acc: ReducedData, curr: QueryResult) => {
          if (!acc[curr.exercise_name]) {
            acc[curr.exercise_name] = {
              exercise_name: curr.exercise_name,
              sets_data: Array(maxReps).fill(null),
            };
          }

          if (curr.sets_data?.reps) {
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
        const data = Object.values(processedData);

        if (data.length * elementWidth <= screenWidth) {
          setElementWidth(screenWidth / data.length);
        } else {
          setElementWidth(120);
        }
        return data;
      });
    };

    fetchData();

    return () => clearTimeout(catchTimeout);
  }, [options.categoryFilter, options.typeFilter, options.hideEmpty]);

  /**
   * Memoized headers for the analytics records.
   *
   * This hook uses `useMemo` to optimize performance by memoizing the headers
   * generated from the `data` array. It maps over the `data` array and creates
   * `HeaderLabels` components for each exercise name, using the exercise name
   * and element width as props.
   *
   * @remarks Unfortunately this can be VERY expensive as the list of data can be quite long
   * but the only reasonable alternative that works is using a linked FlatList which is very
   * choppy and not a good user experience. Realistically the memoization does not help much
   * in this screen as if any of the options are changed the data is almost guaranteed to change.
   *
   * @param {Array} data - The array of data objects containing exercise names.
   * @param {number} elementWidth - The width of the header elements.
   * @returns {JSX.Element[]} An array of `HeaderLabels` components.
   */
  const memoizedHeaders = useMemo(() => {
    return data.map(({ exercise_name }) => (
      <HeaderLabels
        key={`${exercise_name}-header`}
        exerciseName={exercise_name}
        elementWidth={elementWidth}
      />
    ));
  }, [data, elementWidth]);

  /**
   * A scroll handler that updates the `scrollX` value based on the horizontal scroll offset.
   *
   * @param {ReanimatedScrollEvent} event - The scroll event object.
   */
  const scrollHandler: ScrollHandlerProcessed<Record<string, unknown>> =
    useAnimatedScrollHandler({
      onScroll: (event: ReanimatedScrollEvent) => {
        scrollX.value = event.contentOffset.x;
      },
    });

  // Since linked FlatLists are not a good user experience we use this to "scroll" the headers
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  return (
    <View style={styles.screenContainer}>
      <View style={{ overflow: "hidden" }}>
        <Animated.View
          style={[{ flexDirection: "row" }, animatedHeaderStyle]}
          // To improve UX as the headers are a high cost component this gives us another method of managing a loading state
          // When the headers are done laying out the onLayout of this View will be called and we can set loading to false
          onLayout={() => setLoading(false)}
        >
          {memoizedHeaders}
        </Animated.View>
      </View>
      {loading && <LoadingIndicator />}
      {!loading && data.length > 0 && (
        <ScrollView bounces={false} style={styles.scrollView}>
          <Animated.FlatList
            ref={contentScrollRef}
            horizontal
            data={data}
            keyExtractor={(item, index) => item.exercise_name + index}
            renderItem={({ item }: { item: Data }) => (
              <Records data={item} elementWidth={elementWidth} />
            )}
            onScroll={scrollHandler}
            overScrollMode="never"
            bounces={false}
            scrollEventThrottle={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        </ScrollView>
      )}
      {/* 
        For the same reasons outlined above in the onLayout the placeholder is separated out, however 
        this implementation could cause issues but we are using a timeout in the useEffect loop
      */}
      {(!loading && data.length) === 0 && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No data to display</Text>
        </View>
      )}
      {Platform.OS === "android" && (
        <View>
          <AndroidRecordsFilterModal
            options={options}
            setOptions={setOptions}
          />
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
