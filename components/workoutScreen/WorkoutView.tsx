import { Pressable, StyleSheet, Text, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import WorkoutListItem from "./WorkoutListItem";
import { router } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Set, SetPersonalRecord } from "@/types/sets";
import { useContext } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import { ScrollView } from "react-native-gesture-handler";

interface QueryData {
  exerciseId: number | null;
  exerciseName: string | null;
  setsData: Set;
  personal_record: SetPersonalRecord["personal_record"];
}

interface TransformedExerciseData {
  exerciseId: number;
  exerciseName: string;
  sets: SetPersonalRecord[];
}

interface WorkoutViewProps {
  date: string;
  editMode: { edit: boolean; selectedExercises: number[] };
  handleEditMode: (exerciseId: number) => void;
}

/**
 * Component for displaying a workout view based on the provided date.
 *
 * @component
 * @param {WorkoutViewProps} props - The properties for the WorkoutView component.
 * @param {string} props.date - The date for the workout data in ISO 8601 date time format.
 * @param {{ edit: boolean; selectedExercises: number[] }} props.editMode - The current edit mode state object containing a boolean and number array property.
 * @param {(exerciseId: number) => void} props.handleEditMode - Function to handle changes in edit mode.
 *
 * @returns {JSX.Element} The rendered WorkoutView component.
 *
 * @example
 * ```tsx
 * <WorkoutView
 *   date="2023-10-10T00:00:00.000+01:00"
 *   editMode={{ edit: false, selectedExercises: [] }}
 *   handleEditMode={() => {}}
 * />
 * ```
 */
const WorkoutView = ({
  date,
  editMode,
  handleEditMode,
}: WorkoutViewProps): JSX.Element => {
  const { db } = useContext(DrizzleContext);

  const { data }: { data: QueryData[] } = useLiveQuery(
    db
      .select({
        exerciseId: schema.exercises.id,
        exerciseName: schema.exercises.name,
        setsData: schema.setsData,
        personal_record: schema.personalRecords,
      })
      .from(schema.setsData)
      .leftJoin(
        schema.exercises,
        eq(schema.setsData.exercise_id, schema.exercises.id)
      )
      .leftJoin(
        schema.personalRecords,
        eq(schema.setsData.id, schema.personalRecords.set_id)
      )
      .where(eq(schema.setsData.date, date)),
    [date]
    //! IMPORTANT: Drizzle docs were updated on Oct 7th 2024 16:01 UTC, the docs are still
    //! plagued with errors and missing information, live query dependencies among them.
    //! simply put use LiveQuery as you would a useEffect
  );

  return (
    <>
      {data.length > 0 ? (
        <ScrollView
          collapsable={false}
          style={styles.workoutContainer}
          contentContainerStyle={styles.workoutContainerContent}
        >
          {data
            .reduce<TransformedExerciseData[]>((acc, item) => {
              const existingExercise = acc.find(
                (accItem) => accItem.exerciseId === item.setsData.exercise_id
              );

              if (existingExercise) {
                existingExercise.sets.push({
                  ...item.setsData,
                  personal_record: item.personal_record,
                });
              } else {
                acc.push({
                  exerciseId: item.setsData.exercise_id,
                  exerciseName: item.exerciseName!,
                  sets: [
                    { ...item.setsData, personal_record: item.personal_record },
                  ],
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
        </ScrollView>
      ) : (
        <View collapsable={false} style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Workout Empty</Text>
          <Pressable
            onPress={() =>
              router.navigate({
                // /exercises/search/categories avoids trapping the query param in the layout
                pathname: "/exercises/search/categories",
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
    </>
  );
};

export default WorkoutView;

const styles = StyleSheet.create({
  workoutContainer: { width: "100%", height: "100%" },
  workoutContainerContent: { padding: 20, gap: 16 },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  placeholderText: { marginVertical: "62%", color: "#B9B9B9", fontSize: 28 },
  startNewWorkoutContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "25%",
  },
  startNewWorkoutText: { color: "#B9B9B9", fontSize: 17 },
});
