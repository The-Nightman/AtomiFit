import { MaterialTopTabs } from "@/components/layouts/materialTopTabs";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import UtilityStyles from "@/constants/UtilityStyles";

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
  const [exerciseInfo, setExerciseInfo] = useState<{
    name: string;
    type: string;
  }>({
    name: "",
    type: "",
  });
  const [loading, setLoading] = useState(true);
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { db } = useContext(DrizzleContext);

  // Fetch the exercise name from the database using the provided exerciseId.
  useEffect(() => {
    const fetchData = async () => {
      const data:
        | {
            name: string;
            type: string;
          }[]
        | undefined = await db
        .select({ name: schema.exercises.name, type: schema.exercises.type })
        .from(schema.exercises)
        .where(eq(schema.exercises.id, Number(exerciseId)));

      if (data[0]) {
        setExerciseInfo(data[0]);
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciseId, db]);

  return (
    <View style={UtilityStyles.flex1}>
      <View style={[styles.headerContainer]}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
      </View>
      <Text style={styles.exerciseName}>{exerciseInfo.name.toUpperCase()}</Text>
      {!loading && (
        <MaterialTopTabs
          screenOptions={{
            tabBarLabelStyle: { color: "white" },
            tabBarStyle: { backgroundColor: "#0F0F0F" },
            tabBarIndicatorStyle: { backgroundColor: "#60DD49" },
          }}
          sceneContainerStyle={{ backgroundColor: "#0F0F0F" }}
        >
          <MaterialTopTabs.Screen
            name="track"
            options={{ tabBarLabel: "Track" }}
            initialParams={{ exerciseId, exerciseType: exerciseInfo.type }}
          />
          <MaterialTopTabs.Screen // This screen is not yet implemented
            name="history"
            options={{ tabBarLabel: "History" }}
          />
          <MaterialTopTabs.Screen // This screen is not yet implemented
            name="graph"
            options={{ tabBarLabel: "Graph" }}
          />
          <MaterialTopTabs.Screen // This screen is not yet implemented
            name="info"
            options={{ tabBarLabel: "Info" }}
          />
        </MaterialTopTabs>
      )}
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
    marginTop: 8,
    marginHorizontal: 6,
  },
});
