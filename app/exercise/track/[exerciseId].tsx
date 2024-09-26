import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import * as schema from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { getToday } from "@/utils/getToday";
import { Set } from "@/types/sets";
import TrackSetListItem from "@/components/TrackSetListItem";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";

/**
 * Track component.
 * 
 * Track component is responsible for displaying and managing exercise sets for a specific exercise.
 * It fetches the sets data from the database based on the exercise ID and the given date,
 * and displays them in a scrollable list. Users can add new sets using the provided button.
 *
 * @returns {JSX.Element} The rendered component.
 */
const Track = (): JSX.Element => {
  const [sets, setSets] = useState<Set[]>([]);
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { db } = useContext(DrizzleContext);


  // Fetch sets data from the database based on the exercise ID and the current date.
  // Dynamic date not yet implemented, currently only fetches sets for the current date.
  useEffect(() => {
    const data: Set[] = db
      .select()
      .from(schema.setsData)
      .where(
        and(
          // Cast exerciseId to number due to string nature of URL params
          eq(schema.setsData.exercise_id, Number(exerciseId)),
          eq(schema.setsData.date, getToday())
        )
      )
      .all();

    setSets(data);
  }, []);

  return (
    <View style={styles.rootView}>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {sets.map((set, i) => (
          <TrackSetListItem key={set.id} set={set} setNumber={i} />
        ))}
        {/*  */}
        <Pressable
          onPress={() => console.log("add set, not yet implemented")}
          style={({ pressed }) => [
            styles.addSetButton,
            pressed && { backgroundColor: hexcodeLuminosity(styles.addSetButton.backgroundColor, 30) },
          ]}
        >
          <MaterialIcons name="add" size={24} color="#60DD49" />
          <Text style={styles.addSetText}>ADD SET</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default Track;

const styles = StyleSheet.create({
  rootView: { flex: 1, paddingTop: 20 },
  addSetButton: {
    flexDirection: "row",
    height: 44,
    backgroundColor: "#3F3C3C",
    marginHorizontal: 46,
    marginTop: 18,
    marginBottom: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addSetText: { color: "white", fontSize: 22 },
});
