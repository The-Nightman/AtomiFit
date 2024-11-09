import { Pressable, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Entypo } from "@expo/vector-icons";
import { LineGraphOptions } from "@/types/graphs";

interface GraphOptionsProps {
  selectedOptions: LineGraphOptions;
  setSelectedOptions: React.Dispatch<React.SetStateAction<LineGraphOptions>>;
  today: string;
}

/**
 * GraphOptions component renders a set of options for configuring a graph.
 *
 * The component includes:
 * - A dropdown picker to select the type of graph.
 * - A set of buttons to select the timeframe for the graph data.
 * - A menu with additional graph options, toggled by a button.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {Object} props.selectedOptions - The currently selected options for the graph.
 * @param {Function} props.setSelectedOptions - Function to update the selected options.
 * @param {Date} props.today - The current date.
 *
 * @returns {JSX.Element} The rendered component.
 * 
 * @example
 * ```tsx
 * <GraphOptions
 *   selectedOptions={selectedOptions}
 *   setSelectedOptions={setSelectedOptions}
 *   today={"2023-10-10"}
 * />
 */
const GraphOptions = ({
  selectedOptions,
  setSelectedOptions,
  today,
}: GraphOptionsProps): JSX.Element => {
  const [menuVisible, setMenuVisible] = useState({
    state: false,
  });

  return (
    <View style={styles.container}>
      {/* Graph type options and menu button */}
      <View style={styles.optionsContainer}>
        <Picker
          mode="dropdown"
          style={styles.picker}
          itemStyle={styles.pickerItem}
          selectedValue={selectedOptions.selectedGraph}
          onValueChange={(itemValue) =>
            setSelectedOptions({ ...selectedOptions, selectedGraph: itemValue })
          }
        >
          <Picker.Item
            label="Estimated 1RM"
            value="oneRepMax"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Max Weight"
            value="maxWeight"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Max Reps"
            value="maxReps"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Max Volume"
            value="maxVolume"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Max Weight x Reps"
            value="maxWeightReps"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Workout Volume"
            value="workoutVolume"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Workout Reps"
            value="workoutReps"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="Personal Records"
            value="personalRecords"
            style={styles.pickerItem}
          />
        </Picker>
        <Pressable
          style={styles.justifyCenter}
          onPress={() =>
            setMenuVisible((prevState) => ({
              state: !prevState.state,
            }))
          }
        >
          <Entypo name="dots-three-vertical" size={32} color={"#9F9F9F"} />
        </Pressable>
      </View>
      {/* Timeframe Options */}
      <View style={styles.optionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.timeFrameButton,
            (pressed || selectedOptions.startDate === "1M") && {
              backgroundColor: hexcodeLuminosity("#60DD49", -30),
            },
          ]}
          onPress={() =>
            setSelectedOptions({ ...selectedOptions, startDate: "1M" })
          }
        >
          <Text style={{ color: "white" }}>1M</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.timeFrameButton,
            (pressed || selectedOptions.startDate === "3M") && {
              backgroundColor: hexcodeLuminosity("#60DD49", -30),
            },
          ]}
          onPress={() =>
            setSelectedOptions({ ...selectedOptions, startDate: "3M" })
          }
        >
          <Text style={{ color: "white" }}>3M</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.timeFrameButton,
            (pressed || selectedOptions.startDate === "6M") && {
              backgroundColor: hexcodeLuminosity("#60DD49", -30),
            },
          ]}
          onPress={() =>
            setSelectedOptions({ ...selectedOptions, startDate: "6M" })
          }
        >
          <Text style={{ color: "white" }}>6M</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.timeFrameButton,
            (pressed || selectedOptions.startDate === "1Y") && {
              backgroundColor: hexcodeLuminosity("#60DD49", -30),
            },
          ]}
          onPress={() =>
            setSelectedOptions({ ...selectedOptions, startDate: "1Y" })
          }
        >
          <Text style={{ color: "white" }}>1Y</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.timeFrameButton,
            (pressed || selectedOptions.startDate === "ALL") && {
              backgroundColor: hexcodeLuminosity("#60DD49", -30),
            },
          ]}
          onPress={() =>
            setSelectedOptions({ ...selectedOptions, startDate: "ALL" })
          }
        >
          <Text style={{ color: "white" }}>ALL</Text>
        </Pressable>
      </View>
      {/* Menu, elements declared here for visibility */}
      {menuVisible.state && (
        <View style={styles.menuContainer}>
          <Pressable onPress={() => {}} style={styles.menuPressable}>
            <Text style={styles.menuText}>Graph Points</Text>
          </Pressable>
          <Pressable onPress={() => {}} style={styles.menuPressable}>
            <Text style={styles.menuText}>Y-Axis From 0</Text>
          </Pressable>
          <Pressable onPress={() => {}} style={styles.menuPressable}>
            <Text style={styles.menuText}>Trend Line</Text>
          </Pressable>
          <Pressable onPress={() => {}} style={styles.menuPressable}>
            <Text style={styles.menuText}>Custom Date</Text>
          </Pressable>
          <Pressable onPress={() => {}} style={styles.menuPressable}>
            <Text style={styles.menuText}>Share</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default GraphOptions;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  optionsContainer: { flexDirection: "row", gap: 8 },
  picker: {
    flex: 1,
    backgroundColor: "#3F3C3C",
  },
  pickerItem: { color: "white", backgroundColor: "#3F3C3C" },
  timeFrameButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#3F3C3C",
    paddingVertical: 6,
    borderRadius: 6,
  },
  menuContainer: {
    position: "absolute",
    top: 64,
    right: 8,
    minWidth: "50%",
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
    borderRadius: 10,
    elevation: 15,
  },
  menuPressable: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 8,
  },
  menuText: {
    color: "white",
    fontSize: 20,
  },
  justifyCenter: { justifyContent: "center" },
});
