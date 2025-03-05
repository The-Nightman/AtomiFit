import { Set, SetPersonalRecord } from "@/types/sets";
import { displayDate } from "@/utils/displayDate";
import { eventEmitter } from "@/utils/eventEmitter";
import { formatTime } from "@/utils/formatTime";
import { getToday } from "@/utils/getToday";
import { setDisplayVariant } from "@/utils/setDisplayVariant";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface HistoryListItemProps {
  workoutItem: {
    date: string;
    sets: SetPersonalRecord[];
  };
}

/**
 * Component to render a history list item for a workout.
 *
 * @component
 * @param {HistoryListItemProps} props - The properties for the HistoryListItem component.
 * @param {{ date: string; sets: SetPersonalRecord[]; }} props.workoutItem - The workout item containing the date and an array of sets.
 *
 * @returns {JSX.Element} The rendered HistoryListItem component.
 *
 * @example
 * ```tsx
 * <HistoryListItem workoutItem={workoutItem} />;
 * ```
 */
const HistoryListItem = ({
  workoutItem,
}: HistoryListItemProps): JSX.Element => {
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
    <View key={workoutItem.date} style={styles.workoutContainer}>
      <Text style={styles.exerciseDate}>
        {displayDate(workoutItem.date, getToday())}
      </Text>
      <View>
        {workoutItem.sets.map((set) => {
          return (
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
          );
        })}
      </View>
    </View>
  );
};

export default HistoryListItem;

const styles = StyleSheet.create({
  workoutContainer: { paddingVertical: 8, paddingHorizontal: 20, gap: 8 },
  exerciseDate: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
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
});
