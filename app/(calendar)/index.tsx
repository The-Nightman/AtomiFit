import { memo, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import * as Localization from "expo-localization";

/**
 * Calendar component that displays a list of months with child weeks in grid of days for a selected year.
 */
const Calendar = memo(() => {
  const userLocale: string = Localization.useLocales()[0].languageTag; // Get the user's locale from their device language settings
  const startOfWeek = 1; // 1 = Monday, 7 = Sunday, this will be moved to user settings in the future
  // Store selected year in state, Current year default
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  // Store selected day in state, format of `month.name-day` (0-based index) and default to a pseudo-null value 0-0
  const [selectedDay, setSelectedDay] = useState<string>(`0-0`);

  /**
   * Generates an array of month names based on the user's locale.
   * Dependencies run whenever the user's locale changes.
   *
   * @param {string} userLocale - The locale of the user.
   * @returns {string[]} An array of localized month names.
   */
  const localizedMonths: string[] = useMemo(() => {
    const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(userLocale, {
      month: "long",
    });
    // Generate an array of localized month names
    return Array.from({ length: 12 }, (_, i) =>
      formatter.format(new Date(Date.UTC(2024, i, 1)))
    );
  }, [userLocale]);

  /**
   * Generates an array of short weekday names based on the user's locale.
   * Dependencies run whenever the user's locale or selected week start changes.
   *
   * @param {string} userLocale - The locale of the user.
   * @returns {string[]} An array of localized short weekday names.
   */
  const localizedDays: string[] = useMemo(() => {
    const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(userLocale, {
      weekday: "short",
    });
    // Generate an array of localized short weekday names
    return Array.from({ length: 7 }, (_, i) =>
      // i + startOfWeek will order the weekdays by the users selection, default is Monday (1)
      formatter.format(new Date(Date.UTC(2024, 0, i + startOfWeek)))
    );
  }, [userLocale, startOfWeek]);

  /**
   * Generates an array of days in a given month.
   *
   * @param {number} month - The month number (0-11).
   * @returns {(number | null)[]} An array of days in the month, including leading and trailing nulls.
   */
  const generateDaysInMonth = (month: number): (number | null)[] => {
    // Pull the number of the last day of the previous month to get a count of days
    const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
    const adjustedFirstDay =
      (new Date(selectedYear, month, 1).getDay() - startOfWeek + 7) % 7; // Adjust to start on the selected startOfWeek
    const totalDays = daysInMonth + adjustedFirstDay; // Total number of days in that month including leading nulls to be but not trailing

    const rows = Math.ceil(totalDays / 7); // Number of rows to display that month
    const days = [];
    for (let i = 0; i < rows * 7; i++) {
      days.push(
        // If i is within the range of the month, return the day, else return null including leading and trailing null
        i >= adjustedFirstDay && i < adjustedFirstDay + daysInMonth
          ? i - adjustedFirstDay + 1
          : null
      );
    }
    return days;
  };

  /**
   * Generates an array of months with their corresponding days.
   * Users the localizedMonths function to query localized month names, superior optimization to localizing in the map.
   *
   * @returns {Object[]} An array of objects representing each month, containing the month name and an array of days.
   * @property {string} name - The localized name of the month.
   * @property {(number | null)[]} days - An array of days in the month, including leading and trailing nulls.
   */
  const months: { name: string; days: (number | null)[] }[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => ({
      // instead of performing this in function just use the localizedMonths result, witchcraft optimization
      name: localizedMonths[month], // average render down to 0.3ms, lets fucking go
      days: generateDaysInMonth(month),
    }));
  }, [selectedYear, userLocale]);

  return (
    <>
      <View style={styles.yearScrollContainer}>
        <Pressable onPress={() => setSelectedYear((prevYear) => prevYear - 1)}>
          {({ pressed }) => (
            <Entypo
              name="chevron-thin-left"
              size={30}
              color={pressed ? "#2D6823" : "#60DD49"}
            />
          )}
        </Pressable>
        <Text style={styles.yearText}>{selectedYear}</Text>
        <Pressable onPress={() => setSelectedYear((prevYear) => prevYear + 1)}>
          {({ pressed }) => (
            <Entypo
              name="chevron-thin-right"
              size={30}
              color={pressed ? "#2D6823" : "#60DD49"}
            />
          )}
        </Pressable>
      </View>
      <ScrollView>
        {months.map((month, _) => (
          <View key={`${month.name}`} style={styles.monthContainer}>
            <Text style={styles.monthName}>{month.name}</Text>
            <View style={styles.monthWeeksContainer}>
              <View style={styles.daysContainer}>
                {localizedDays.map((dayName, _) => (
                  <Text
                    key={`${month.name}-${dayName}`}
                    style={styles.weekDays}
                  >
                    {dayName.toLocaleUpperCase()}
                  </Text>
                ))}
              </View>
              {month.days
                // Chunk the days into weeks, far more efficient than the previous method of chunking while generating
                .reduce<(number | null)[][]>((weeks, day, i) => {
                  // Calculate the week index based on the day index, this stops us from having
                  // to calculate every 7 items as if we were chunking with a for loop
                  const weekIndex = Math.floor(i / 7);
                  // Initialize the week if it doesn't exist
                  if (!weeks[weekIndex]) {
                    weeks[weekIndex] = [];
                  }
                  weeks[weekIndex].push(day); // Push the day into the week chunk before we go again
                  return weeks;
                }, [])
                // Map the week chunks into JSX
                .map((week, weekIndex) => (
                  <View
                    key={`${month.name}-${weekIndex}`}
                    style={styles.daysContainer}
                  >
                    {week.map((day, dayIndex) => {
                      if (day !== null) {
                        return (
                          <Pressable
                            key={`${month.name}-${day}-${dayIndex}`}
                            onPress={() =>
                              day && setSelectedDay(`${month.name}-${day}`)
                            }
                            style={
                              selectedDay === `${month.name}-${day}`
                                ? styles.selectedDayButton
                                : styles.dayButton
                            }
                          >
                            <Text style={styles.dayText}>{day}</Text>
                          </Pressable>
                        );
                      } else {
                        // Empty tiles for null days to preserve layout
                        return (
                          <View
                            key={`${month}-${day}-${dayIndex}`}
                            style={styles.dayBlank}
                          />
                        );
                      }
                    })}
                  </View>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
});

const styles = StyleSheet.create({
  yearScrollContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#60DD49",
  },
  yearText: {
    color: "white",
    fontSize: 22,
  },
  monthContainer: {
    marginVertical: 20,
    alignSelf: "center",
    alignItems: "center",
    width: "85%",
  },
  monthName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  monthWeeksContainer: {
    width: "100%",
  },
  weekDays: {
    color: "white",
    fontSize: 13,
    width: 36,
    marginBottom: 5,
    textAlign: "center",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  dayButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    borderRadius: 20,
    marginVertical: 4,
  },
  selectedDayButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    backgroundColor: "#60DD49",
    borderRadius: 20,
    marginVertical: 4,
  },
  dayBlank: {
    width: 36,
    height: 36,
    marginVertical: 4,
  },
  dayText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});

export default memo(Calendar);
