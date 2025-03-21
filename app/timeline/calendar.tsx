import { DrizzleContext } from "@/contexts/drizzleContext";
import { getContrastTextColour } from "@/utils/getContrastTextColour";
import { getToday } from "@/utils/getToday";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarList, DateData } from "react-native-calendars";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import { eventEmitter } from "@/utils/eventEmitter";
import { CalendarListImperativeMethods } from "react-native-calendars/src/calendar-list";
import { Theme } from "react-native-calendars/src/types";
import { DayProps } from "react-native-calendars/src/calendar/day";
import { dateToUTCZero } from "@/utils/dateToUTCZero";
import { useSettings } from "@/contexts/settingsContext";
import { Category } from "@/types/categories";

interface DOT {
  key: string;
  color: string;
}

interface CategoriesKeys {
  [key: string]: DOT;
}

interface MarkedDates {
  [key: string]: { dots: DOT[]; selected: boolean };
}

interface SelectedDate {
  [key: string]: {
    selected: boolean;
    selectedColor: string;
    dots: DOT[];
  };
}

/**
 * Calendar component.
 *
 * This component displays the calendar screen with a scrollable FlatList calendar.
 * It allows the user to select a year and a specific day within a span of 100 years prior to
 * and after the current date to give the impression of a semi-infinite calendar.
 * The component also queries the database for exercise categories and workouts performed
 * on selected days and renders multi dot indicators for each category on marked dates
 *
 * @returns {JSX.Element} The rendered Calendar component.
 */
const Calendar = (): JSX.Element => {
  const [selectedDate, setSelectedDate] = useState<SelectedDate>({
    [dateToUTCZero(new Date(getToday())).toISOString().split("T")[0]]: {
      selected: true,
      selectedColor: "#60DD49",
      dots: [],
    },
  });
  const [categoriesKeys, setCategoriesKeys] = useState<CategoriesKeys>({});
  const [workouts, setWorkouts] = useState<MarkedDates>({});
  const [filters, setFilters] = useState<Category["id"][]>([]);
  const calendarRef = useRef<CalendarListImperativeMethods>(null);
  const { db } = useContext(DrizzleContext);
  const { appSettings } = useSettings();

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
    // Function to handle returning to the current day when the event is emitted
    // If there are logged workouts for today, select the day from the marked dates
    // and copy the dots array to the selected date.
    const returnToToday = () => {
      const today = dateToUTCZero(new Date(getToday()))
        .toISOString()
        .split("T")[0];
      setSelectedDate(() => {
        if (workouts[today]) {
          return {
            [today]: {
              selected: true,
              selectedColor: "#60DD49",
              dots: workouts[today].dots || [],
            },
          };
        }
        return {
          [today]: {
            selected: true,
            selectedColor: "#60DD49",
            dots: [],
          },
        };
      });
      calendarRef.current?.scrollToMonth(getToday());
    };

    eventEmitter.on("calendarReturnToToday", () => returnToToday());

    return () => {
      eventEmitter.off("calendarReturnToToday", () => returnToToday());
    };
  }, [JSON.stringify(workouts)]);

  useEffect(() => {
    const getCategories = async () => {
      const categories: { id: number; name: string; colour: string }[] =
        await db.select().from(schema.categories);

      const filteredCategories = categories.filter((category) => {
        if (filters.length === 0) return true;
        return filters.includes(category.id);
      });

      const categoriesMarkingVariants =
        filteredCategories.reduce<CategoriesKeys>((acc, category) => {
          if (!acc[category.name]) {
            acc[category.name] = {
              key: category.name,
              color: category.colour,
            };
          }

          return acc;
        }, {});

      setCategoriesKeys(categoriesMarkingVariants);
    };
    getCategories();
  }, [filters]);

  useEffect(() => {
    const getWorkouts = async () => {
      const data = await db
        .select({
          id: schema.setsData.id,
          date: schema.setsData.date,
          category_name: schema.categories.name,
        })
        .from(schema.setsData)
        .leftJoin(
          schema.exercises,
          eq(schema.setsData.exercise_id, schema.exercises.id)
        )
        .leftJoin(
          schema.categories,
          eq(schema.exercises.category_id, schema.categories.id)
        );

      const markedDates = data.reduce<MarkedDates>((acc, workout) => {
        const date = dateToUTCZero(new Date(workout.date))
          .toISOString()
          .split("T")[0];

        if (!categoriesKeys[workout.category_name!]) {
          return acc;
        }

        if (!acc[date]) {
          acc[date] = {
            dots: [categoriesKeys[workout.category_name!]],
            selected: false,
          };
        }

        if (acc[date]) {
          if (
            !acc[date].dots.find(
              (dot) => dot.key === categoriesKeys[workout.category_name!].key
            )
          ) {
            acc[date].dots.push(categoriesKeys[workout.category_name!]);
          }
        }

        return acc;
      }, {});

      const selectedDateKey = Object.keys(selectedDate)[0];
      // We need to check if the selected date has any saved workouts, if it does
      // we need to copy them over to guarantee the correct rendering of the dots.
      if (markedDates[selectedDateKey]) {
        setSelectedDate({
          [selectedDateKey]: {
            selected: true,
            selectedColor: "#60DD49",
            dots: markedDates[selectedDateKey].dots,
          },
        });
      }
      // Else if the selected date has no saved workouts, i.e. the user has set
      // filter options then we need to remove the stale data
      else if (
        !markedDates[selectedDateKey] &&
        selectedDate[selectedDateKey].dots.length > 0
      ) {
        setSelectedDate({
          [selectedDateKey]: {
            selected: true,
            selectedColor: "#60DD49",
            dots: [],
          },
        });
      }
      setWorkouts(markedDates);
    };
    getWorkouts();
  }, [JSON.stringify(categoriesKeys)]);

  /**
   * Handles the event when a day is pressed in the calendar.
   *
   * @param {DateData} day - The date data of the pressed day.
   * @returns {void}
   */
  const onDayPress = (day: DateData): void => {
    setSelectedDate({
      [day.dateString]: {
        selected: true,
        selectedColor: "#60DD49",
        dots: workouts[day.dateString]?.dots,
      },
    });
  };

  // Custom theme for the calendar, styles used in CustomDay component are set in the stylesheet
  const theme: Theme = {
    calendarBackground: "transparent",
    textMonthFontWeight: "bold" as TextStyle["fontWeight"],
    textMonthFontSize: 17,
    dayTextColor: "white",
    monthTextColor: "white",
    textSectionTitleColor: "white",
    todayTextColor: "#60DD49",
    selectedDayTextColor: getContrastTextColour("#60DD49"),
  };

  return (
    <CalendarList
      // I would really REALLY like to know who is going to actively work out for 200 years but we'll do it live
      // I've explored using FlatList props and such to load more months but it wont work
      pastScrollRange={1200}
      futureScrollRange={1200}
      ref={calendarRef}
      onDayPress={(day) => onDayPress(day)}
      markedDates={{ ...workouts, ...selectedDate }}
      markingType="custom"
      dayComponent={(props) => <CustomDay {...props} theme={theme} />}
      theme={theme}
      firstDay={appSettings?.calendarWeekStart}
    />
  );
};

/**
 * CustomDay component renders a calendar day with optional markings and styles.
 * The component has custom rendering for multi-dot markings with a function for dynamic
 * size handling for the wrapping of long lists of dot indicators.
 *
 * @param {DayProps & { date?: DateData; }} props - The properties object.
 * @param {DateData} props.date - The date data object for the day.
 * @param {DayState} props.state - The day state (e.g., "selected" | "today" | "disabled").
 * @param {MarkingProps | undefined} props.marking - The marking object containing selected state, color, and dots.
 * @param {boolean} props.marking.selected - Indicates if the day is selected.
 * @param {string} props.marking.selectedColor - The color for the selected day.
 * @param {DOT[]} props.marking.dots - An array of dot objects to display below the day.
 * @param {((date?: DateData) => void) | undefined} props.onPress - The function to call when the day is pressed.
 *
 * @returns {JSX.Element} The rendered CustomDay component.
 */
const CustomDay = ({
  date,
  state,
  marking,
  onPress,
  theme,
}: DayProps & {
  date?: DateData;
  theme?: Theme;
}): JSX.Element => {
  const { selected, selectedColor, dots } = marking || {};
  const isToday = state === "today";

  /**
   * Calculates the size of the dots container based on the number of dots to handle wrapping appropriately.
   *
   * @returns {number} The size of the dots container.
   */
  const sizeDotsContainer = useCallback(() => {
    if (!dots) return 0;
    if (dots.length === 5) return 28;
    if (dots.length === 6) return 24;
    if (dots.length > 8) return 38;
    return 32;
  }, [dots]);

  return (
    <TouchableOpacity
      // This will match the accessibility label of the default day component
      accessibilityLabel={`${new Date(date!.dateString).toLocaleDateString(
        undefined,
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )} ${dots?.length ? "workout saved" : ""}`}
      onPress={() => onPress && onPress(date)}
      style={[
        styles.dayContainer,
        selected && { backgroundColor: selectedColor || "#00BBF2" }, // Default value as a fallback option
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.dayText,
          isToday && { color: theme?.todayTextColor || "#00BBF2" }, // Default value as a fallback option
          selected && {
            color: theme?.selectedDayTextColor || "white", // Default value as a fallback option
          },
        ]}
      >
        {date?.day}
      </Text>
      {dots && dots.length > 0 && (
        <View
          style={[
            styles.dotsContainer,
            { bottom: selected ? -8 : 0, width: sizeDotsContainer() },
          ]}
        >
          {dots.map((dot, index) => (
            <View
              key={`${date?.dateString}-${dot.key}-${index}`}
              style={[styles.dot, { backgroundColor: dot.color }]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 300,
  },
  dayText: {
    color: "white",
    fontSize: 15,
    fontWeight: "400",
  },
  dotsContainer: {
    position: "absolute",
    flexDirection: "row",
    flexWrap: "wrap",
    height: 6, // This makes setting the position consistent and easier to manage for every combination
    width: 28,
    justifyContent: "center",
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Calendar;
