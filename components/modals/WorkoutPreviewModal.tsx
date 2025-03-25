import { Pressable, StyleSheet, Text, View } from "react-native";
import ModalBase from "./ModalBase";
import { useContext, useEffect, useState } from "react";
import { eventEmitter } from "@/utils/eventEmitter";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { ScrollView } from "react-native-gesture-handler";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import { Set, SetPersonalRecord } from "@/types/sets";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { setDisplayVariant } from "@/utils/setDisplayVariant";
import { formatTime } from "@/utils/formatTime";
import { router } from "expo-router";

interface Workout {
  date: string;
  data: WorkoutExercise[];
}

interface WorkoutExercise {
  exercise_name: string;
  sets: SetPersonalRecord[];
}

/**
 * WorkoutPreviewModal component displays a modal with a preview of a saved workout.
 * It fetches workout data from the database based on the provided workout date
 * and displays the sets grouped by exercise. If no workout data is found for the
 * provided date, a message is displayed indicating that there is no data.
 * The modal can be opened by emitting the "openWorkoutPreviewModal" event with a workout date.
 *
 * @returns {JSX.Element} The WorkoutPreviewModal component.
 *
 * @component
 * @example
 * return (
 *  <WorkoutPreviewModal />
 * )
 */
const WorkoutPreviewModal = (): JSX.Element => {
  const [modalState, setModalState] = useState(false);
  const [workout, setWorkout] = useState<Workout>({ date: "", data: [] });
  const { db } = useContext(DrizzleContext);

  useEffect(() => {
    const getWorkoutData = async (workoutDate: string) => {
      const data = await db
        .select({
          id: schema.setsData.id,
          date: schema.setsData.date,
          exercise_name: schema.exercises.name,
          weight: schema.setsData.weight,
          reps: schema.setsData.reps,
          distance: schema.setsData.distance,
          time: schema.setsData.time,
          notes: schema.setsData.notes,
          weight_unit: schema.setsData.weight_unit,
          distance_unit: schema.setsData.distance_unit,
          exercise_id: schema.setsData.exercise_id,
          personal_record: schema.personalRecords,
        })
        .from(schema.setsData)
        .innerJoin(
          schema.exercises,
          eq(schema.setsData.exercise_id, schema.exercises.id)
        )
        .leftJoin(
          schema.personalRecords,
          eq(schema.setsData.id, schema.personalRecords.set_id)
        )
        .where(eq(schema.setsData.date, workoutDate));

      const processedWorkout = data.reduce<Workout>(
        (acc, set) => {
          if (!acc.data.length) {
            acc.data.push({
              exercise_name: set.exercise_name,
              sets: [set],
            });
            return acc;
          }

          const exerciseIndex = acc.data.findIndex(
            (exercise) => exercise.exercise_name === set.exercise_name
          );

          if (exerciseIndex === -1) {
            acc.data.push({
              exercise_name: set.exercise_name,
              sets: [set],
            });
          } else {
            acc.data[exerciseIndex].sets.push(set);
          }

          return acc;
        },
        {
          date: workoutDate,
          data: [],
        }
      );

      setWorkout(processedWorkout);
    };

    eventEmitter.on("openWorkoutPreviewModal", async (workoutDate) => {
      await getWorkoutData(workoutDate);
      setModalState(true);
    });

    return () => {
      eventEmitter.off("openWorkoutPreviewModal", async (workoutDate) => {
        await getWorkoutData(workoutDate);
        setModalState(true);
      });
    };
  }, []);

  // Dictionary of display variants based on the keys of the set object
  const displayVariants: Record<
    string,
    (set: SetPersonalRecord) => React.JSX.Element
  > = {
    weight_reps: (set: SetPersonalRecord) => (
      <>
        <Text style={styles.setData}>
          {set.weight} <Text style={styles.setDataUnit}>{set.weight_unit}</Text>
        </Text>
        <Text style={styles.setData}>
          {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
        </Text>
      </>
    ),
    distance_time: (set: SetPersonalRecord) => (
      <>
        <Text style={styles.setData}>
          {set.distance}
          <Text style={styles.setDataUnit}> {set.distance_unit}</Text>
        </Text>
        <Text style={styles.setData}>{formatTime(set.time!)}</Text>
      </>
    ),
    weight_distance: (set: SetPersonalRecord) => (
      <>
        <Text style={styles.setData}>
          {set.weight} <Text style={styles.setDataUnit}>{set.weight_unit}</Text>
        </Text>
        <Text style={styles.setData}>
          {set.distance}
          <Text style={styles.setDataUnit}> {set.distance_unit}</Text>
        </Text>
      </>
    ),
    weight_time: (set: SetPersonalRecord) => (
      <>
        <Text style={styles.setData}>
          {set.weight} <Text style={styles.setDataUnit}>{set.weight_unit}</Text>
        </Text>
        <Text style={styles.setData}>{formatTime(set.time!)}</Text>
      </>
    ),
    reps_distance: (set: SetPersonalRecord) => (
      <>
        <Text style={styles.setData}>
          {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
        </Text>
        <Text style={styles.setData}>
          {set.distance}
          <Text style={styles.setDataUnit}> {set.distance_unit}</Text>
        </Text>
      </>
    ),
    reps_time: (set: SetPersonalRecord) => (
      <>
        <Text style={styles.setData}>
          {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
        </Text>
        <Text style={styles.setData}>{formatTime(set.time!)}</Text>
      </>
    ),
    weight: (set: SetPersonalRecord) => (
      <Text style={styles.setData}>
        {set.weight} <Text style={styles.setDataUnit}>{set.weight_unit}</Text>
      </Text>
    ),
    reps: (set: SetPersonalRecord) => (
      <Text style={styles.setData}>
        {set.reps} <Text style={styles.setDataUnit}>Reps</Text>
      </Text>
    ),
    distance: (set: SetPersonalRecord) => (
      <Text style={styles.setData}>
        {set.distance}
        <Text style={styles.setDataUnit}> {set.distance_unit}</Text>
      </Text>
    ),
    time: (set: Set) => (
      <Text style={styles.setData}>{formatTime(set.time!)}</Text>
    ),
  };

  return (
    <ModalBase modalState={modalState} setModalState={setModalState}>
      <View style={styles.modalBody}>
        <Text style={styles.workoutDate}>
          {new Date(workout.date)
            .toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            .toUpperCase()}
        </Text>
        {workout.data.length > 0 ? (
          <ScrollView style={{ width: "100%" }}>
            {workout.data.map((exercise) => (
              <View key={exercise.exercise_name}>
                <Text style={styles.exerciseText}>
                  {exercise.exercise_name}
                </Text>
                {exercise.sets.map((set) => (
                  <View key={set.id} style={styles.setDataContainer}>
                    <View style={styles.setNotesPersonalRecordContainer}>
                      {!set.notes ? (
                        <View style={styles.setNotesPlaceholder} />
                      ) : (
                        <Pressable
                          onPress={() =>
                            eventEmitter.emit("notesModal", set.id, set.notes)
                          }
                          style={styles.setNotesAndPrButton}
                        >
                          <MaterialIcons
                            name="speaker-notes"
                            size={24}
                            color="#60DD49"
                          />
                        </Pressable>
                      )}
                      {!set.personal_record ? (
                        <View style={styles.setNotesPlaceholder} />
                      ) : (
                        <Pressable
                          onPress={() => console.log("PR, not yet implemented")}
                          style={styles.setNotesAndPrButton}
                        >
                          <MaterialCommunityIcons
                            name="trophy"
                            size={24}
                            color="#60DD49"
                          />
                        </Pressable>
                      )}
                    </View>
                    <View style={styles.setDataSubContainer}>
                      {/* This typecasting isnt ideal however SetPersonalRecord is an extension of Set */}
                      {setDisplayVariant(
                        set,
                        displayVariants as Record<
                          string,
                          (set: Set) => React.JSX.Element
                        >
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No data for this workout</Text>
          </View>
        )}
        <View style={styles.modalButtonContainer}>
          <Pressable
            style={[styles.buttonBase, styles.cancelButton]}
            onPress={() => {
              setModalState(false);
              setWorkout({ date: "", data: [] });
            }}
          >
            <Text style={styles.buttonText}>CANCEL</Text>
          </Pressable>
          <Pressable
            style={[styles.buttonBase, styles.nextButton]}
            onPress={() => {
              router.dismissAll();
              router.replace({
                pathname: "/",
                params: { paramDate: workout.date },
              });
            }}
          >
            <Text style={styles.buttonText}>GO TO</Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};

export default WorkoutPreviewModal;

const styles = StyleSheet.create({
  modalBody: {
    width: "90%",
    height: "95%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  workoutDate: {
    width: "100%",
    color: "white",
    fontSize: 22,
    fontWeight: "600",
    borderBottomWidth: 4,
    borderBottomColor: "#60DD49",
  },
  exerciseText: {
    color: "white",
    fontSize: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#60DD49",
  },
  setDataContainer: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 8,
  },
  setNotesPersonalRecordContainer: { flexDirection: "row", flex: 0.5, gap: 16 },
  setNotesPlaceholder: { width: 32 },
  setNotesAndPrButton: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  setDataSubContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setData: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
    textAlign: "right",
    flex: 1,
  },
  setDataUnit: { color: "white", fontWeight: "normal", fontSize: 13 },
  modalButtonContainer: { flexDirection: "row", gap: 16 },
  buttonBase: {
    flex: 1,
    width: "30%",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#2B72DE",
  },
  cancelButton: {
    backgroundColor: "#CD2C2C",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "white", fontSize: 22 },
});
