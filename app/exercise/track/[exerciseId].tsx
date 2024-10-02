import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import { useContext, useEffect, useRef, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import * as schema from "@/database/schema";
import { and, eq, max } from "drizzle-orm";
import { getToday } from "@/utils/getToday";
import { Set } from "@/types/sets";
import TrackSetListItem from "@/components/TrackSetListItem";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
  const [setColumnWidth, setSetColumnWidth] = useState<number>(0);
  const [menuVisible, setMenuVisible] = useState<{
    state: boolean;
    pos: { x: number; y: number };
    currentSelectedId: number | null;
  }>({
    state: false,
    pos: { x: 0, y: 0 },
    currentSelectedId: null,
  });
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { db } = useContext(DrizzleContext);
  const containerRef = useRef<View>(null);
  const overlayWidth = useSharedValue<number>(0);

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

  /**
   * Adds a new set to the exercise tracking state.
   *
   * If there are existing sets, it copies the most recent set, clears the notes, and removes the ID.
   * If there are no existing sets, it checks for the most recent workout date for the exercise.
   * - If no previous sets are found, it creates a blank set.
   * - If previous sets are found, it copies the first set from the most recent date.
   *
   * The new set is then inserted into the database and added to the state with the new ID.
   *
   * @returns {Promise<void>} A promise that resolves when the new set has been added.
   */
  const addNewSet = async (): Promise<void> => {
    // If there are sets copy the previous for user convenience
    if (sets.length > 0) {
      // Copy the previous set, blank the notes and delete the id
      const newSet = { ...sets[sets.length - 1], notes: "" };
      delete newSet.id;
      // Insert the new set and return the id
      const newSetId = await db
        .insert(schema.setsData)
        .values(newSet)
        .returning({ id: schema.setsData.id });
      // Add the new set to the state with the new id
      setSets([...sets, { ...newSet, id: newSetId[0].id }]);
      return; // Return early
    }

    // If there are no sets, fetch the date of the most recent workout with the exercise or null
    const mostRecentDateQuery: { recentDate: string | null } | undefined = db
      .select({ recentDate: max(schema.setsData.date) })
      .from(schema.setsData)
      .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
      .get();

    // If the most recent date query is false there are no previous sets
    // Therefore we create a blank set, otherwise we copy the previous set outside the block
    if (
      !mostRecentDateQuery ||
      !mostRecentDateQuery.recentDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(mostRecentDateQuery.recentDate)
    ) {
      // If there are no sets, create a blank set
      // Currently only supports weight and reps as not yet fully implemented
      const newSet: Set = {
        exercise_id: Number(exerciseId),
        date: getToday(),
        weight: 0,
        reps: 0,
        distance: null,
        time: null,
        notes: "",
      };

      // Insert the new set and return the id
      const newSetId = await db
        .insert(schema.setsData)
        .values(newSet)
        .returning({ id: schema.setsData.id });

      // Add the new set to the state with the new id
      setSets([...sets, { ...newSet, id: newSetId[0].id }]);
      return; // Return early
    }

    // If there are sets, copy the first set from the most recent date
    // This lets the user start with their warmup weight and reps
    // Or provides a reference for progressive overload
    const firstSetQuery: Set | undefined = db
      .select()
      .from(schema.setsData)
      .where(
        and(
          eq(schema.setsData.exercise_id, Number(exerciseId)),
          eq(schema.setsData.date, mostRecentDateQuery!.recentDate!)
        )
      )
      .orderBy(schema.setsData.id)
      .limit(1)
      .get();

    // Return early if the query fails for some reason, at this point it should be gauranteed
    if (!firstSetQuery) return;

    // Copy the previous set, blank the notes, delete the id and set the date to today
    delete firstSetQuery.id;
    firstSetQuery.date = getToday();
    firstSetQuery.notes = "";

    // Insert the new set and return the id
    const newSetId = await db
      .insert(schema.setsData)
      .values(firstSetQuery)
      .returning({ id: schema.setsData.id });

    // Add the new set to the state with the new id
    setSets([...sets, { ...firstSetQuery, id: newSetId[0].id }]);
  };

  /**
   * Handles the visibility of the menu.
   *
   * @param id - The database row id for the set the menu is opened for.
   * @param visible - A boolean indicating whether the menu should be visible.
   * @param pos - The position of the menu, containing x and y coordinates.
   *
   * @returns {void}
   */
  const handleMenuVisible = (
    id: number,
    visible: boolean,
    pos: { x: number; y: number }
  ): void => {
    setMenuVisible({ state: visible, pos: pos, currentSelectedId: id });
  };

  /**
   * Deletes the currently selected set from the database and updates the state.
   *
   * This function deletes the set from the database using the current selected ID in the menu state.
   * It then resets the menu state and removes the set from the state.
   * If the selected set ID is null or undefined, the function returns early without performing any actions.
   *
   * @returns {Promise<void>} A promise that resolves when the set has been deleted and the state has been updated.
   */
  const deleteSet = async (): Promise<void> => {
    overlayWidth.value = withTiming(0);

    if (!menuVisible.currentSelectedId) return; // Return early if no set is selected
    await db
      .delete(schema.setsData)
      .where(eq(schema.setsData.id, menuVisible.currentSelectedId));

    // Reset the menu state and selected id
    setMenuVisible({
      state: false,
      pos: { x: 0, y: 0 },
      currentSelectedId: null,
    });
    // Remove the set from the state
    setSets(sets.filter((set) => set.id !== menuVisible.currentSelectedId));
  };

  // Reanimated styles for the background of the set menu delete button
  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate the color of the background based on the overlay width value
    // This will fade from red to dark red as the overlay width increases
    const backgroundColor = interpolateColor(
      overlayWidth.value,
      [0, 1],
      ["#d10000", "#9b0000"]
    );

    return {
      width: `${overlayWidth.value * 100}%`,
      backgroundColor,
    };
  });
  // Handle press in event for reanimated styles
  const handlePressIn = () => {
    overlayWidth.value = withTiming(1, { duration: 1000 });
  };
  // Handle press out event for reanimated styles
  const handlePressOut = () => {
    overlayWidth.value = withTiming(0);
  };

  return (
    <View style={styles.rootView}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View
          hitSlop={{ top: 200, bottom: 2000 }}
          style={styles.scrollViewInner}
          onTouchEnd={() => {
            setMenuVisible({
              state: false,
              pos: { x: 0, y: 0 },
              currentSelectedId: null,
            });
            overlayWidth.value = withTiming(0);
          }}
          ref={containerRef}
        >
          {/* Column titles */}
          <View style={styles.columnTitlesContainer}>
            <Text
              style={styles.columnTitleText}
              onLayout={(e) => setSetColumnWidth(e.nativeEvent.layout.width)}
            >
              SET
            </Text>
            <View style={styles.w24} />
            <Text style={[{ width: 32 }, styles.columnTitleText]}>PR</Text>
            <View style={styles.inputColumnTitleContainer}>
              <View style={styles.inputColumnInnerTitleContainer}>
                <Text style={styles.inputColumnTitleText}>WEIGHT - KG</Text>
                <Text style={styles.inputColumnTitleText}>REPS</Text>
              </View>
              <View style={styles.w24} />
            </View>
          </View>
          {/* Mapped sets */}
          {sets.map((set, i) => (
            <TrackSetListItem
              key={set.id || `newset-${i}`}
              set={set}
              setNumber={i}
              setColumnWidth={setColumnWidth}
              menuVisible={menuVisible}
              setMenuVisible={handleMenuVisible}
              containerRef={containerRef}
            />
          ))}
          {/* Add set button */}
          <Pressable
            onPress={() => addNewSet()}
            style={({ pressed }) => [
              styles.addSetButton,
              pressed && {
                backgroundColor: hexcodeLuminosity(
                  styles.addSetButton.backgroundColor,
                  30
                ),
              },
            ]}
          >
            <MaterialIcons name="add" size={24} color="#60DD49" />
            <Text style={styles.addSetText}>ADD SET</Text>
          </Pressable>
          {/* Delete popup */}
          {menuVisible.state && (
            <View
              style={[
                styles.menuContainer,
                { top: menuVisible.pos.y, right: menuVisible.pos.x },
              ]}
            >
              {/* Animated View for background to give visual feedback */}
              <Animated.View
                style={[styles.animatedViewBaseStyle, animatedStyle]}
              />
              <Pressable
                onPressIn={() => handlePressIn()}
                onPressOut={() => handlePressOut()}
                onLongPress={() => deleteSet()}
                delayLongPress={1000}
                style={styles.menuPressable}
              >
                <Text style={styles.menuDeleteText}>Delete Set</Text>
                <MaterialCommunityIcons
                  name="delete-forever-outline"
                  size={20}
                  color={hexcodeLuminosity("#ff0000", -20)}
                />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Track;

const styles = StyleSheet.create({
  rootView: { flex: 1, paddingTop: 20 },
  scrollView: { minHeight: "auto" },
  scrollViewInner: { gap: 16 },
  columnTitlesContainer: {
    flexDirection: "row",
    height: 36,
    justifyContent: "space-between",
    paddingHorizontal: 8,
    gap: 16,
  },
  columnTitleText: {
    color: "white",
    textAlign: "center",
    alignSelf: "center",
  },
  w24: { width: 24 },
  inputColumnTitleContainer: { flex: 1, flexDirection: "row", gap: 8 },
  inputColumnInnerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  inputColumnTitleText: { flex: 1, color: "white", textAlign: "center" },
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
  menuContainer: {
    position: "absolute",
    width: "50%",
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
    borderRadius: 10,
    elevation: 15,
    overflow: "hidden",
  },
  animatedViewBaseStyle: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    borderRadius: 10,
  },
  menuPressable: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 8,
  },
  menuDeleteText: {
    color: hexcodeLuminosity("#ff0000", -20), // Darken the red by 20%, this makes it a lot easier to look at
    fontSize: 20,
  },
});
