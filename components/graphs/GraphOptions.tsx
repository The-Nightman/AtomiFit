import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { ExerciseGraphSelections, LineGraphOptions } from "@/types/graphs";
import GraphDateRangePicker from "./GraphDateRangePicker";
import ModalBase from "../modals/ModalBase";
import PickeriOSButton from "../inputs/pickers/PickeriOSButton";
import BottomSheetPickeriOS from "../inputs/pickers/BottomSheetPickeriOS";
import { eventEmitter } from "@/utils/eventEmitter";

interface DataDateRange {
  startDate: string;
  endDate: string;
}

interface GraphOptionsProps {
  optionsType: string;
  selectedOptions: LineGraphOptions;
  setSelectedOptions: React.Dispatch<React.SetStateAction<LineGraphOptions>>;
  today: string;
  dataDateRange: DataDateRange;
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
 * @param {string} props.optionsType - The type of graph options to display.
 * @param {LineGraphOptions} props.selectedOptions - The currently selected options for the graph.
 * @param {React.Dispatch<React.SetStateAction<LineGraphOptions>>} props.setSelectedOptions - Function to update the selected options.
 * @param {Date} props.today - The current date.
 * @param {DataDateRange} props.dataDateRange - The date range data containing the `startDate` and `endDate` properties.
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * ```tsx
 * <GraphOptions
 *   selectedOptions={selectedOptions}
 *   setSelectedOptions={setSelectedOptions}
 *   today={"2023-10-10"}
 *   dataDateRange={{ startDate: "2023-09-10", endDate: "2023-10-10" }}
 * />
 */
const GraphOptions = ({
  optionsType,
  selectedOptions,
  setSelectedOptions,
  today,
  dataDateRange,
}: GraphOptionsProps): JSX.Element => {
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [datepickerVisible, setDatepickerVisible] = useState<boolean>(false);

  useEffect(() => {
    // Set the default selected graph option based on the provided options type
    setSelectedOptions({
      ...selectedOptions,
      selectedGraph: getOptions(optionsType)[0].value,
    });
  }, []);

  /**
   * Retrieves the available graph options based on the provided type.
   *
   * @param {string} type - The type of graph options to retrieve.
   *                        Possible values include:
   *                        - "WeightRepsOptions"
   *                        - "DistanceTimeOptions"
   *                        - "WeightTimeOptions"
   *                        - "WeightDistanceOptions"
   *                        - "WeightOptions"
   *                        - "TimeOptions"
   *                        - "RepsTimeOptions"
   *                        - "RepsDistanceOptions"
   *                        - "RepsOptions"
   *                        - "DistanceOptions"
   * @returns {{ label: string; value: string; }[]} An array of objects, each containing a label and an value key.
   */
  const getOptions = (
    type: string
  ): { label: string; value: ExerciseGraphSelections }[] => {
    const options: {
      [key: string]: { label: string; value: ExerciseGraphSelections }[];
    } = {
      WeightRepsOptions: [
        { label: "Estimated 1RM", value: "oneRepMax" },
        { label: "Max Weight", value: "maxWeight" },
        { label: "Max Reps", value: "maxReps" },
        { label: "Max Volume", value: "maxVolume" },
        { label: "Max Weight x Reps", value: "maxWeightReps" },
        { label: "Workout Volume", value: "workoutVolume" },
        { label: "Workout Reps", value: "workoutReps" },
        { label: "Personal Records", value: "personalRecords" },
      ],
      DistanceTimeOptions: [
        { label: "Max Distance", value: "maxDistance" },
        { label: "Max Time", value: "maxTime" },
        { label: "Max Speed", value: "maxSpeed" },
        { label: "Max Pace", value: "maxPace" },
        { label: "Workout Distance", value: "workoutDistance" },
        { label: "Workout Time", value: "workoutTime" },
      ],
      WeightTimeOptions: [
        { label: "Max Weight", value: "maxWeight" },
        { label: "Max Time", value: "maxTime" },
        { label: "Workout Time", value: "workoutTime" },
      ],
      WeightDistanceOptions: [
        { label: "Max Weight", value: "maxWeight" },
        { label: "Max Distance", value: "maxDistance" },
        { label: "Workout Distance", value: "workoutDistance" },
      ],
      WeightOptions: [{ label: "Max Weight", value: "maxWeight" }],
      TimeOptions: [
        { label: "Max Time", value: "maxTime" },
        { label: "Workout Time", value: "workoutTime" },
      ],
      RepsTimeOptions: [
        { label: "Max Reps", value: "maxReps" },
        { label: "Workout Reps", value: "workoutReps" },
        { label: "Max Time", value: "maxTime" },
        { label: "Workout Time", value: "workoutTime" },
      ],
      RepsDistanceOptions: [
        { label: "Max Reps", value: "maxReps" },
        { label: "Workout Reps", value: "workoutReps" },
        { label: "Max Distance", value: "maxDistance" },
        { label: "Workout Distance", value: "workoutDistance" },
      ],
      RepsOptions: [
        { label: "Max Reps", value: "maxReps" },
        { label: "Workout Reps", value: "workoutReps" },
      ],
      DistanceOptions: [
        { label: "Max Distance", value: "maxDistance" },
        { label: "Workout Distance", value: "workoutDistance" },
      ],
    };

    return options[type];
  };

  /**
   * Checks if the selected date range is a custom date range.
   *
   * This function returns `true` if the `selectedOptions.startDate` is not one of the predefined
   * date ranges ("1M", "3M", "6M", "1Y", "ALL"). Otherwise, it returns `false`.
   *
   * @returns {boolean} `true` if a custom date range is set, `false` otherwise.
   */
  const isCustomDateSet = (): boolean => {
    return (
      selectedOptions.startDate !== "1M" &&
      selectedOptions.startDate !== "3M" &&
      selectedOptions.startDate !== "6M" &&
      selectedOptions.startDate !== "1Y" &&
      selectedOptions.startDate !== "ALL"
    );
  };

  return (
    <>
      <View
        style={[
          styles.container,
          Platform.OS === "android" && { paddingTop: 8, gap: 8 }, // on iOS this causes a lot of wasted space
        ]}
      >
        {/* Graph type options and menu button */}
        <View style={styles.optionsContainer}>
          {Platform.OS === "ios" ? (
            <View
              style={{
                flex: 1,
              }}
            >
              <PickeriOSButton
                text={
                  getOptions(optionsType).filter(
                    (option) => option.value === selectedOptions.selectedGraph
                  )[0].label
                }
                onPress={() => eventEmitter.emit("openGraphTypePicker")}
                padding={0} // This is to help prevent wasted space same as above
              />
            </View>
          ) : (
            <Picker
              mode="dropdown"
              style={styles.picker}
              selectedValue={selectedOptions.selectedGraph}
              onValueChange={(itemValue) =>
                setSelectedOptions({
                  ...selectedOptions,
                  selectedGraph: itemValue,
                })
              }
            >
              {getOptions(optionsType).map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
          )}
          <Pressable
            style={styles.justifyCenter}
            onPress={() => {
              setMenuVisible(!menuVisible);
            }}
          >
            <Entypo name="dots-three-vertical" size={32} color={"#9F9F9F"} />
          </Pressable>
        </View>
        {isCustomDateSet() ? (
          // Custom Date Range
          <View style={styles.customDateContainer}>
            <Text style={styles.customDateTitle}>DATE:</Text>
            <View style={styles.customDateSubcontainer}>
              <Text style={styles.customDateText}>
                {new Date(selectedOptions.startDate).toLocaleDateString(
                  undefined,
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </Text>
              <Text style={{ color: "white" }}>To</Text>
              <Text style={styles.customDateText}>
                {new Date(selectedOptions.endDate).toLocaleDateString(
                  undefined,
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </Text>
            </View>
            <Pressable
              style={styles.cancelCustomDateButton}
              onPress={() =>
                setSelectedOptions({
                  ...selectedOptions,
                  startDate: "1M",
                  endDate: today,
                })
              }
            >
              {({ pressed }) => (
                <MaterialCommunityIcons
                  name="calendar-remove"
                  size={24}
                  color={
                    pressed ? hexcodeLuminosity("#60DD49", -60) : "#60DD49"
                  }
                />
              )}
            </Pressable>
          </View>
        ) : (
          // Timeframe Options
          <View style={styles.optionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.timeFrameButton,
                (pressed || selectedOptions.startDate === "1M") && {
                  backgroundColor: hexcodeLuminosity("#60DD49", -30),
                },
              ]}
              onPress={() => {
                setSelectedOptions({ ...selectedOptions, startDate: "1M" });
                // Close menu if pressed on all date button options, this keeps
                // things responsive just as with the picker focus
                setMenuVisible(false);
              }}
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
              onPress={() => {
                setSelectedOptions({ ...selectedOptions, startDate: "3M" });
                setMenuVisible(false);
              }}
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
              onPress={() => {
                setSelectedOptions({ ...selectedOptions, startDate: "6M" });
                setMenuVisible(false);
              }}
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
              onPress={() => {
                setSelectedOptions({ ...selectedOptions, startDate: "1Y" });
                setMenuVisible(false);
              }}
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
              onPress={() => {
                setSelectedOptions({ ...selectedOptions, startDate: "ALL" });
                setMenuVisible(false);
              }}
            >
              <Text style={{ color: "white" }}>ALL</Text>
            </Pressable>
          </View>
        )}
        {/* Menu, elements declared here for visibility */}
        {!datepickerVisible && ( // This is enough to allow us to use the datepicker after using the menu modal on iOS
          <ModalBase
            modalState={menuVisible}
            setModalState={setMenuVisible}
            animationProps={{
              animationIn: "zoomInRight",
              animationOut: "zoomOutRight",
            }}
            backdropStyle={
              // We need to do this because of quirks on iOS impacting functionality, view ModalBase jsdocs for more info
              Platform.OS === "ios"
                ? { color: "#ffffff00", opacity: 1 }
                : { color: "", opacity: 0 }
            }
          >
            <View style={styles.menuContainer}>
              <Pressable
                onPress={() =>
                  setSelectedOptions((prevState) => ({
                    ...prevState,
                    graphPoints: !prevState.graphPoints,
                  }))
                }
                style={styles.menuPressable}
              >
                <Text style={styles.menuText}>Graph Points</Text>
                {selectedOptions.graphPoints ? (
                  <MaterialCommunityIcons
                    name="checkbox-outline"
                    size={24}
                    color={"#60DD49"}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={24}
                    color={hexcodeLuminosity("#9F9F9F", 30)}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() =>
                  setSelectedOptions((prevState) => ({
                    ...prevState,
                    yAxisFromZero: !prevState.yAxisFromZero,
                  }))
                }
                style={styles.menuPressable}
              >
                <Text style={styles.menuText}>Y-Axis From 0</Text>
                {selectedOptions.yAxisFromZero ? (
                  <MaterialCommunityIcons
                    name="checkbox-outline"
                    size={24}
                    color={"#60DD49"}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={24}
                    color={hexcodeLuminosity("#9F9F9F", 30)}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() =>
                  setSelectedOptions((prevState) => ({
                    ...prevState,
                    trendline: !prevState.trendline,
                  }))
                }
                style={styles.menuPressable}
              >
                <Text style={styles.menuText}>Trend Line</Text>
                {selectedOptions.trendline ? (
                  <MaterialCommunityIcons
                    name="checkbox-outline"
                    size={24}
                    color={"#60DD49"}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={24}
                    color={hexcodeLuminosity("#9F9F9F", 30)}
                  />
                )}
              </Pressable>
              {isCustomDateSet() ? (
                <Pressable
                  onPress={() => {
                    setSelectedOptions({
                      ...selectedOptions,
                      startDate: "1M",
                      endDate: today,
                    });
                    setMenuVisible(false);
                  }}
                  style={styles.menuPressable}
                >
                  <Text style={styles.menuText}>Clear Custom Date</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setDatepickerVisible(true);
                    setMenuVisible(false);
                  }}
                  style={styles.menuPressable}
                >
                  <Text style={styles.menuText}>Custom Date</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {}}
                style={[styles.menuPressable, { borderBottomWidth: 0 }]}
              >
                <Text style={styles.menuText}>Share</Text>
              </Pressable>
            </View>
          </ModalBase>
        )}
        {/* Modal for custom date selection */}
        <GraphDateRangePicker
          modalVisible={datepickerVisible}
          setModalVisible={setDatepickerVisible}
          dataDateRange={dataDateRange}
          setDateRange={setSelectedOptions}
          selectedOptions={selectedOptions}
        />
      </View>
      {Platform.OS === "ios" && (
        // We may need to refactor how we do this depending on how it functions with accessibility later on
        <>
          <BottomSheetPickeriOS
            eventName="openGraphTypePicker"
            data={getOptions(optionsType)}
            value={selectedOptions.selectedGraph}
            onChange={(value) =>
              setSelectedOptions({
                ...selectedOptions,
                selectedGraph: value,
              })
            }
          />
        </>
      )}
    </>
  );
};

export default GraphOptions;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
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
  customDateContainer: { flexDirection: "row", gap: 8, alignItems: "center" },
  customDateTitle: { color: "white", fontSize: 17, fontWeight: "600" },
  customDateSubcontainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 16,
  },
  customDateText: {
    flex: 1,
    color: "white",
    borderBottomWidth: 1.5,
    borderBottomColor: "#9F9F9F",
  },
  cancelCustomDateButton: { marginRight: 4 },
  menuContainer: {
    position: "absolute",
    top: "31.5%",
    right: 0,
    minWidth: "50%",
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
    borderRadius: 10,
    elevation: 15,
    zIndex: 10,
  },
  menuPressable: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#9F9F9F",
  },
  menuText: {
    color: "white",
    fontSize: 20,
  },
  justifyCenter: { justifyContent: "center" },
  modalBody: {
    minWidth: "80%",
    minHeight: "35%",
    maxHeight: "70%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
  },
});
