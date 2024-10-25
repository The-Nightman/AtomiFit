import { View, Text, StyleSheet, Pressable, BackHandler } from "react-native";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import UtilityStyles from "@/constants/UtilityStyles";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import DumbbellIconSVG from "@/components/Svg/DumbbellSVG";
import { router } from "expo-router";
import { getToday } from "@/utils/getToday";
import { useContext, useEffect, useRef, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { displayDate } from "@/utils/displayDate";
import InfinitePager, {
  InfinitePagerImperativeApi,
} from "react-native-infinite-pager";
import WorkoutView from "@/components/workoutScreen/WorkoutView";

const index = () => {
  const [date, setDate] = useState<string>(getToday());
  const [editMode, setEditMode] = useState<{
    edit: boolean;
    selectedExercises: number[];
  }>({ edit: false, selectedExercises: [] });
  const pagerViewRef = useRef<InfinitePagerImperativeApi>(null);

  const { db } = useContext(DrizzleContext);

  // Create an event listener for the back button to exit edit mode without navigation
  useEffect(() => {
    const onBackPress = () => {
      if (editMode.edit) {
        // Exit edit mode and clear selected exercises, user may press back
        // while exercises are selected so the array needs to be emptied
        setEditMode({ edit: false, selectedExercises: [] });
        return true; // Prevent default back button behavior
      }
      return false; // Let the default back button behavior take over, not necessary but good semantics
    };

    // Add back button listener
    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    // Remove back button listener
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [editMode.edit]);

  // Exit edit mode when no exercises are selected
  useEffect(() => {
    if (editMode.selectedExercises.length === 0) {
      setEditMode({ ...editMode, edit: false });
    }
  }, [editMode.selectedExercises]);

  /**
   * Toggles the edit mode the screen when exercises are present and handles the selection of exercises.
   *
   * When the edit mode is not active, it activates the edit mode and adds the id of the
   * exercise interacted with to the selected exercises.
   * When the edit mode is active, it toggles the selection of the given exercise.
   * If the exercise id is already selected, it will be removed from the selection.
   * If the exercise id is not selected, it will be added to the selection.
   *
   * @param {number} exerciseId - The id of the exercise to select or deselect when enabling edit mode.
   * @returns {void}
   */
  const handleEditMode = (exerciseId: number): void => {
    setEditMode((prevState) => {
      // If edit mode is not active, activate it and select the exercise
      if (!prevState.edit) {
        return {
          edit: true,
          selectedExercises: [exerciseId],
        };
      }

      const isSelected = prevState.selectedExercises.includes(exerciseId);
      // Toggle the selection of the exercise based on boolean value above
      return {
        ...prevState,
        selectedExercises: isSelected
          ? prevState.selectedExercises.filter((id) => id !== exerciseId)
          : [...prevState.selectedExercises, exerciseId],
      };
    });
  };

  /**
   * Deletes exercises from the database based on the selected date and exercise IDs.
   *
   * The function deletes entries from the `setsData` table where the date matches the provided date
   * AND the exercise IDs are in the array of selected exercises in the editMode state.
   * The function resets the edit mode state, setting `edit` to false and clearing the list of selected exercises.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  const handleDeleteExercises = async (): Promise<void> => {
    await db.delete(schema.setsData).where(
      // If row matches both date AND is inArray of selected exercises
      and(
        eq(schema.setsData.date, date),
        inArray(schema.setsData.exercise_id, editMode.selectedExercises)
      )
    );

    // Reset edit mode state, assuming at this point the user has finished edits they wished to perform
    setEditMode({
      edit: false,
      selectedExercises: [],
    });
  };

  /**
   * Local utility function that calculates a new date by adding a specified number
   * of days to a given date. Passing a negative number will subtract days.
   *
   * @param {string} date - The initial date as a string in the format YYYY-MM-DD.
   * @param {number} days - The number of days to add to the initial date.
   * @returns {string} The new date as a string in the format YYYY-MM-DD.
   */
  const calculateDate = (date: string, days: number): string => {
    const parsedDate = new Date(date);
    parsedDate.setDate(parsedDate.getDate() + days);
    // Return the date in ISO format without the time so we get a YYYY-MM-DD string
    return parsedDate.toISOString().split("T")[0];
  };

  /**
   * Function to return the component representing a workout page for a specific day.
   *
   * The date is calculated based on the current day and the provided index.
   * Swiping left decreases the date (e.g., today - 1, today - 2, etc.),
   * while swiping right increases the date.
   *
   * @param {Object} props - The component props.
   * @param {number} props.index - The index representing the page and subsequently the day offset from today.
   * @returns {JSX.Element} The rendered workout view for the specified day.
   */
  const DayWorkoutPage = ({ index }: { index: number }): JSX.Element => {
    return (
      <WorkoutView
        // Calculate based on getToday as using date state will desync the pager
        // i.e. 1 left swipe = today - 1 (the day before), 1 more left swipe = date - 2 (3 days before today) etc
        // Inverse is true for right swipes
        date={calculateDate(getToday(), index)}
        editMode={editMode}
        handleEditMode={handleEditMode}
      />
    );
  };

  /**
   * Handles the infinite pager functionality by updating the date based on the given index.
   *
   * @param {number} index - The index used to calculate the new date.
   * @returns {void}
   */
  const handleInfinitePager = (index: number): void => {
    setDate(calculateDate(getToday(), index));
  };

  /**
   * Resets the date to today's date and sets the pager view to the first page without animation.
   *
   * This function updates the state with the current date by calling `setDate` with the result of `getToday()`.
   * If the `pagerViewRef` is defined, it sets the pager view to the first page (index 0) without animation.
   *
   * @returns {void}
   */
  const handleDateReset = (): void => {
    setDate(getToday());
    if (pagerViewRef.current) {
      pagerViewRef.current.setPage(0, { animated: false });
    }
  };

  return (
    <View style={UtilityStyles.flex1}>
      {/* Header, contains interactive elements and is specific to this screen */}
      <View style={[styles.headerContainer]}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
        {/* Container for pressable elements */}
        <View style={styles.headerButtonsContainer}>
          {editMode.edit ? (
            <>
              {/* Delete selected exercises button */}
              <Pressable
                style={styles.headerSettingsButton}
                onPress={() => handleDeleteExercises()}
              >
                {({ pressed }) => (
                  <MaterialCommunityIcons
                    name="delete-forever-outline"
                    size={32}
                    color={
                      pressed
                        ? hexcodeLuminosity("#ff0000", -110)
                        : hexcodeLuminosity("#ff0000", 0)
                    }
                  />
                )}
              </Pressable>
            </>
          ) : (
            <>
              {/* Calendar button */}
              <Pressable
                style={styles.headerCalendarButton}
                onPress={() =>
                  router.push({
                    pathname: "/calendar",
                  })
                }
              >
                {({ pressed }) => (
                  <MaterialIcons
                    name="calendar-month"
                    size={32}
                    color={pressed ? "#2D6823" : "#60DD49"}
                  />
                )}
              </Pressable>
              {/* Exercises button */}
              <Pressable
                style={styles.headerExercisesButton}
                onPress={() =>
                  router.push({
                    // /exercisesSearch/categories avoids trapping the query param in the layout
                    pathname: "/exercisesSearch/categories",
                    params: { date: date },
                  })
                }
              >
                {({ pressed }) => (
                  <DumbbellIconSVG
                    width={48}
                    height={42}
                    color={pressed ? "#2D6823" : "#60DD49"}
                  />
                )}
              </Pressable>
              {/* Settings/More button */}
              <Pressable
                onPress={() => console.log("settings")}
                style={styles.headerSettingsButton}
              >
                {({ pressed }) => (
                  <Entypo
                    name="dots-three-vertical"
                    size={32}
                    color={pressed ? "#2D6823" : "#60DD49"}
                  />
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
      {/* Date scrolling container */}
      <View style={styles.dateScrollContainer}>
        <Pressable
          onPress={() => {
            if (pagerViewRef.current) {
              pagerViewRef.current.decrementPage({ animated: true });
            }
          }}
        >
          {({ pressed }) => (
            <Entypo
              name="chevron-thin-left"
              size={30}
              color={pressed ? "#2D6823" : "#60DD49"}
            />
          )}
        </Pressable>
        <Pressable
          hitSlop={10}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? hexcodeLuminosity("#0F0F0F", 60)
                : "transparent",
              paddingHorizontal: 12,
            },
          ]}
          onPress={() => handleDateReset()}
        >
          <Text style={styles.dateText}>{displayDate(date, getToday())}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (pagerViewRef.current) {
              pagerViewRef.current.incrementPage({ animated: true });
            }
          }}
        >
          {({ pressed }) => (
            <Entypo
              name="chevron-thin-right"
              size={30}
              color={pressed ? "#2D6823" : "#60DD49"}
            />
          )}
        </Pressable>
      </View>
      {/* Pager scrolling */}
      <InfinitePager
        style={{ flex: 1 }}
        ref={pagerViewRef}
        PageComponent={DayWorkoutPage}
        onPageChange={(index) => handleInfinitePager(index)}
        pageBuffer={1}
      />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    height: 120,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerIcon: { marginLeft: 6 },
  headerButtonsContainer: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    gap: 16,
    marginRight: 12,
  },
  headerCalendarButton: {
    height: 42,
    backgroundColor: "#292929",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  headerExercisesButton: {
    height: 42,
    backgroundColor: "#292929",
    paddingHorizontal: 2,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSettingsButton: {
    height: 42,
    width: 42,
    backgroundColor: "#292929",
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dateScrollContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#60DD49",
  },
  dateText: {
    color: "white",
    fontSize: 22,
  },
  workoutContainer: { padding: 20, gap: 16 },
  placeholderContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
  },
  placeholderText: { marginVertical: "auto", color: "#B9B9B9", fontSize: 28 },
  startNewWorkoutContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "25%",
  },
  startNewWorkoutText: { color: "#B9B9B9", fontSize: 17 },
});
