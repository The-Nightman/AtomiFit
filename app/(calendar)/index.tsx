import { memo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import UtilityStyles from "@/constants/UtilityStyles";

/**
 * Calendar component that displays a list of months with child weeks in grid of days for a selected year.
 */
const Calendar = () => {
  // Store selected year in state, Current year default
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  // Store selected day in state, format of `month-day` (0-based index) and default to a pseudo-null value 0-0
  const [selectedDay, setSelectedDay] = useState<string>(`0-0`);
  // Explicit Array of month names, may be converted to map or programatically generated array later for localization
  const months: string[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /**
   * Returns an array of days in the specified month and year.
   * The array includes leading nulls for empty slots in the calendar before the first day of the month.
   *
   * @param {number} month - The month (0-11) for which to get the days.
   * @param {number} year - The year selected.
   * @returns {Array<(null|number)>} An array of days in the specified month and year.
   */
  const getDaysInMonth = (month: number, year: number): (null | number)[] => {
    // Generate an array of nulls to calculate empty slots in the calendar before the first day of the month
    const firstDay = new Date(year, month, 1).getDay();
    const startOfWeek = 1; // 1 = Monday, -5 = Sunday
    const emptySlots = (firstDay - startOfWeek + 7) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Fill initial slots with leading nulls for empty days
    const days: (null | number)[] = Array(emptySlots).fill(null);
    // Fill the days of the month while the month is the same
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  /**
   * Renders the days of the month in a grid format.
   *
   * @param {number} month - The month (0-11) for which to render the days.
   * @returns {React.JSX.Element} The days of the month in a grid format.
   */
  const renderMonth = (month: number, year: number): React.JSX.Element => {
    const days: (null | number)[] = getDaysInMonth(month, year);
    // Initialise an array of weeks to render the days in a grid format
    // Array is a 2D array of weeks, each containing 7 days
    const arrWeeks: (null | number)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      // Slice a chunk of 7 days from the point i onwards
      const chunk: (null | number)[] = days.slice(i, i + 7);
      while (chunk.length < 7) {
        // Fill the chunk with nulls until its length is 7
        chunk.push(null);
      }
      arrWeeks.push(chunk);
    }
    // Render the days in a grid format
    return (
      <View style={styles.monthWeeksContainer}>
        <View style={styles.daysContainer}>
          <Text style={styles.weekDays}>MON</Text>
          <Text style={styles.weekDays}>TUE</Text>
          <Text style={styles.weekDays}>WED</Text>
          <Text style={styles.weekDays}>THU</Text>
          <Text style={styles.weekDays}>FRI</Text>
          <Text style={styles.weekDays}>SAT</Text>
          <Text style={styles.weekDays}>SUN</Text>
        </View>
        {/* map the weeks */}
        {arrWeeks.map((week, index) => (
          <View key={`${month}-${index}`} style={styles.daysContainer}>
            {/* map the days in that week */}
            {week.map((day, index) => {
              if (day !== null) {
                return (
                  <TouchableOpacity
                    key={`${month}-${day}-${index}`}
                    onPress={() => day && handleDayPress(day, month)}
                    style={
                      selectedDay === `${month}-${day}`
                        ? styles.selectedDayButton
                        : styles.dayButton
                    }
                  >
                    <Text style={styles.dayText}>{day}</Text>
                  </TouchableOpacity>
                );
              } else {
                return <View key={`${month}-${day}-${index}`} style={styles.dayBlank} />;
              }
            })}
          </View>
        ))}
      </View>
    );
  };

  /**
   * Handles the press event for a specific day in the calendar.
   * Not yet fully implemented.
   *
   * @param {number} day - The day of the month.
   * @param {number} month - The month (0-based index).
   */
  const handleDayPress = (day: number, month: number) => {
    setSelectedDay(`${month}-${day}`);
  };

  return (
    <>
      <View
        style={styles.yearScrollContainer}
      >
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
        {months.map((monthName, index) => {
          return (
            <View key={monthName} style={styles.monthContainer}>
              <Text
                style={styles.monthName}
              >{`${monthName} ${selectedYear}`}</Text>
              {renderMonth(index, selectedYear)}
            </View>
          );
        })}
      </ScrollView>
    </>
  );
};

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
