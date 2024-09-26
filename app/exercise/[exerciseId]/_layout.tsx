import { MaterialTopTabs } from "@/components/layouts/materialTopTabs";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * ExerciseLayout component.
 *
 * This renders the layout of the exercise screen and its subscreens with swipe navigation.
 * It fetches the exercise name from the database using the provided exerciseId and displays it above the tabs.
 * The component uses a material top tab navigation with four screens: track, history, graph, and info.
 *
 * @returns {JSX.Element} The rendered component.
 */
const ExerciseLayout = (): JSX.Element => {
  const [exerciseName, setExerciseName] = useState<string>("");
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { db } = useContext(DrizzleContext);

  // Fetch the exercise name from the database using the provided exerciseId.
  useEffect(() => {
    const data = db
      .select({ name: schema.exercises.name })
      .from(schema.exercises)
      .where(eq(schema.exercises.id, Number(exerciseId)))
      .get()!.name;

    setExerciseName(data);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.headerContainer]}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
      </View>
      <Text style={styles.exerciseName}>{exerciseName.toUpperCase()}</Text>
      <MaterialTopTabs
        screenOptions={{
          tabBarLabelStyle: { fontSize: 17, color: "white" },
          tabBarStyle: { backgroundColor: "#0F0F0F" },
          tabBarIndicatorStyle: { backgroundColor: "#60DD49" },
        }}
        sceneContainerStyle={{ backgroundColor: "#0F0F0F" }}
      >
        <MaterialTopTabs.Screen name="track" />
        <MaterialTopTabs.Screen name="history" />
        <MaterialTopTabs.Screen name="graph" />
        <MaterialTopTabs.Screen name="info" />
      </MaterialTopTabs>
    </View>
  );
};

export default ExerciseLayout;

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
  exerciseName: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
    marginHorizontal: 12,
  },
});
