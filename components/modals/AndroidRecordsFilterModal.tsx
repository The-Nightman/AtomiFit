import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Picker } from "@react-native-picker/picker";
import { ExerciseTypes } from "@/types/exercise";
import ModalBase from "./ModalBase";
import { exerciseTypes } from "@/constants/ExerciseTypes";
import { eventEmitter } from "@/utils/eventEmitter";

interface RecordsFilterModalProps {
  options: Options;
  setOptions: React.Dispatch<React.SetStateAction<Options>>;
}

interface Options {
  catPickerData: { id: number; name: string }[];
  categoryFilter: "all" | number;
  typeFilter: ExerciseTypes;
  hideEmpty: boolean;
}

/**
 * AndroidRecordsFilterModal component provides a modal interface for filtering records.
 * It allows users to filter by category, type and whether to hide or show empty records.
 *
 * @param {RecordsFilterModalProps} props - The properties for the modal component.
 * @param {Options} props.options - The current filter options.
 * @param {React.Dispatch<React.SetStateAction<Options>>} props.setOptions - Function to update the filter options.
 * 
 * @component
 * @returns {JSX.Element} The rendered modal component.
 *
 * @example
 * ```tsx
 * const [options, setOptions] = useState({
 *   categoryFilter: "all",
 *   typeFilter: "Cardio",
 *   hideEmpty: false,
 *   catPickerData: [{ id: 1, name: "Category 1" }, { id: 2, name: "Category 2" }],
 * });
 * 
 * <AndroidRecordsFilterModal options={options} setOptions={setOptions} />
 * ```
 */
const AndroidRecordsFilterModal = ({
  options,
  setOptions,
}: RecordsFilterModalProps): JSX.Element => {
  const [modalVisible, setModalVisible] = useState(false);
  const [inputState, setInputState] = useState<{
    categoryFilter: "all" | number;
    typeFilter: ExerciseTypes;
    hideEmpty: boolean;
  }>({
    // If we implement state saving of the filters for the records screen then consider replacing this with a useEffect
    categoryFilter: options.categoryFilter,
    typeFilter: options.typeFilter,
    hideEmpty: options.hideEmpty,
  });
  const screenWidth = Dimensions.get("window").width;
  const togglePosition = useSharedValue(0);
  const textColor = useSharedValue(0);

  // We keep the controlling state internal here to reduce the state calls in an already expensive screen
  useEffect(() => {
    eventEmitter.on("openRecordsFilterModal", () => {
      setModalVisible(true);
    });

    return () => {
      eventEmitter.off("openRecordsFilterModal", () => {
        setModalVisible(true);
      });
    };
  }, []);

  useEffect(() => {
    togglePosition.value = withSpring(inputState.hideEmpty ? 1 : 0, {
      damping: 15,
      stiffness: 120,
      mass: 1,
    });

    textColor.value = withTiming(inputState.hideEmpty ? 0 : 1, {
      duration: 300,
    });
  }, [inputState.hideEmpty]);

  // The animated style controlling the position of the toggle background between the 2 states
  const toggleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: (togglePosition.value * (screenWidth * 0.76 - 20)) / 2 },
      ],
    };
  });

  const leftTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(textColor.value, [0, 1], ["#FFFFFF", "#000000"]),
  }));

  const rightTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(textColor.value, [0, 1], ["#000000", "#FFFFFF"]),
  }));

  /**
   * Handles the confirmation of filters by updating the parent options state with the
   * current input state values and then hides the modal.
   *
   * @returns {void}
   */
  const handleFiltersConfirm = (): void => {
    setOptions({
      ...options,
      categoryFilter: inputState.categoryFilter,
      typeFilter: inputState.typeFilter,
      hideEmpty: inputState.hideEmpty,
    });
    setModalVisible(false);
  };

  return (
    <ModalBase
      modalState={modalVisible}
      setModalState={setModalVisible}
      onDismiss={() =>
        setInputState({
          categoryFilter: options.categoryFilter,
          typeFilter: options.typeFilter,
          hideEmpty: options.hideEmpty,
        })
      }
    >
      <View style={styles.modalBody}>
        <View style={styles.modalFilterSectionContainer}>
          <Text style={styles.modalFilterSectionText}>CATEGORY FILTER:</Text>
          <Picker
            mode="dropdown"
            style={styles.picker}
            selectedValue={inputState.categoryFilter}
            onValueChange={(itemValue: "all" | number) =>
              setInputState({
                ...inputState,
                categoryFilter: itemValue,
              })
            }
          >
            <Picker.Item style={styles.pickerItem} label="All" value="all" />
            {options.catPickerData.map((category) => (
              <Picker.Item
                key={category.id}
                style={styles.pickerItem}
                label={category.name}
                value={category.id}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.modalFilterSectionContainer}>
          <Text style={styles.modalFilterSectionText}>TYPE FILTER:</Text>
          <Picker
            mode="dropdown"
            style={styles.picker}
            selectedValue={inputState.typeFilter}
            onValueChange={(itemValue: ExerciseTypes) =>
              setInputState({
                ...inputState,
                typeFilter: itemValue,
              })
            }
          >
            {exerciseTypes.map((type) => (
              <Picker.Item
                key={type}
                style={styles.pickerItem}
                label={type}
                value={type}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.modalFilterSectionContainer}>
          <Text style={styles.modalFilterSectionText}>DISPLAY EMPTY:</Text>
          <View style={styles.toggleContainer}>
            <Animated.View
              style={[styles.toggleBackground, toggleAnimatedStyle]}
            />
            <Pressable
              style={styles.toggleOption}
              onPress={() => setInputState({ ...inputState, hideEmpty: false })}
            >
              <Animated.Text
                style={[
                  styles.toggleText,
                  leftTextStyle,
                  !inputState.hideEmpty ? styles.toggleActiveText : null,
                ]}
              >
                Show All
              </Animated.Text>
            </Pressable>
            <Pressable
              style={styles.toggleOption}
              onPress={() => setInputState({ ...inputState, hideEmpty: true })}
            >
              <Animated.Text
                style={[
                  styles.toggleText,
                  rightTextStyle,
                  inputState.hideEmpty ? styles.toggleActiveText : null,
                ]}
              >
                Hide Empty
              </Animated.Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.modalButtonContainer}>
          <Pressable
            style={styles.confirmButton}
            onPress={() => handleFiltersConfirm()}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};

export default AndroidRecordsFilterModal;

const styles = StyleSheet.create({
  modalBody: {
    width: "90%",
    minHeight: "30%",
    maxHeight: "95%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
    gap: 32,
  },
  modalFilterSectionContainer: { width: "100%", gap: 8 },
  modalFilterSectionText: { fontSize: 17, color: "white", fontWeight: "600" },
  picker: { backgroundColor: "#3F3C3C" },
  pickerItem: { color: "white", backgroundColor: "#3F3C3C" },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#3F3C3C",
    borderRadius: 8,
    height: 40,
    position: "relative",
    overflow: "hidden",
  },
  toggleBackground: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#60DD49",
    borderRadius: 8,
  },
  toggleOption: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontWeight: "500",
  },
  toggleActiveText: {
    fontWeight: "700",
  },
  modalButtonContainer: { flexDirection: "row", gap: 16 },
  confirmButton: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#60DD49",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
