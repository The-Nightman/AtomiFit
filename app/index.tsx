import { View, Text, StyleSheet, Pressable, BackHandler } from "react-native";
import {
  AntDesign,
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import UtilityStyles from "@/constants/UtilityStyles";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import DumbbellIconSVG from "@/components/Svg/DumbbellSVG";
import { router } from "expo-router";
import { getToday } from "@/utils/getToday";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Set } from "@/types/sets";
import WorkoutListItem from "@/components/WorkoutListItem";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";

interface QueryData {
  exerciseId: number | null;
  exerciseName: string | null;
  setsData: Set;
}

interface TransformedExerciseData {
  exerciseId: number;
  exerciseName: string;
  sets: Set[];
}

const index = () => {
  const [date, setDate] = useState(getToday());
  const [editMode, setEditMode] = useState<{
    edit: boolean;
    selectedExercises: number[];
  }>({ edit: false, selectedExercises: [] });
  const { db } = useContext(DrizzleContext);

  const { data }: { data: QueryData[] } = useLiveQuery(
    db
      .select({
        exerciseId: schema.exercises.id,
        exerciseName: schema.exercises.name,
        setsData: schema.setsData,
      })
      .from(schema.setsData)
      .leftJoin(
        schema.exercises,
        eq(schema.setsData.exercise_id, schema.exercises.id)
      )
      .where(eq(schema.setsData.date, date)),
    [date] // re-run query when date changes
    //! IMPORTANT: Drizzle docs were updated on Oct 7th 2024 16:01 UTC, the docs are still
    //! plagued with errors and missing information, live query dependencies among them.
    //! simply put use LiveQuery as you would a useEffect
  );

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
      {/* Placeholder */}
      {data.length > 0 ? (
        <View style={styles.workoutContainer}>
          {data
            .reduce<TransformedExerciseData[]>((acc, item) => {
              // Check if the exercise already exists in the accumulator
              const existingExercise = acc.find(
                (accItem) => accItem.exerciseId === item.setsData.exercise_id
              );
              if (existingExercise) {
                // If it does, push the new set data to the existing exercise
                existingExercise.sets.push(item.setsData);
              } else {
                // If it doesn't, create a new exercise object and push it to the accumulator
                acc.push({
                  exerciseId: item.setsData.exercise_id,
                  exerciseName: item.exerciseName!,
                  sets: [item.setsData],
                });
              }

              return acc;
            }, [])
            .map((exercise: TransformedExerciseData) => {
              return (
                <WorkoutListItem
                  key={exercise.exerciseId}
                  exercise={exercise}
                  date={date}
                  editMode={editMode.edit}
                  handleEditMode={handleEditMode}
                  selected={editMode.selectedExercises.includes(
                    exercise.exerciseId
                  )}
                />
              );
            })}
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Workout Empty</Text>
          <Pressable
            onPress={() =>
              router.push({
                // /exercisesSearch/categories avoids trapping the query param in the layout
                pathname: "/exercisesSearch/categories",
                params: { date: date },
              })
            }
            style={styles.startNewWorkoutContainer}
          >
            {({ pressed }) => (
              <>
                <AntDesign
                  name="plus"
                  size={42}
                  color={pressed ? "#2D6823" : "#60DD49"}
                />
                <Text
                  style={[
                    styles.startNewWorkoutText,
                    pressed && { color: "#A0A0A0" },
                  ]}
                >
                  Start New Workout
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
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
