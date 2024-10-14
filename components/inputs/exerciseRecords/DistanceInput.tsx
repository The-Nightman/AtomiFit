import {
  ColorValue,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import SelectTextInput from "../SelectTextInput";
import { useEffect, useState } from "react";
import { Picker } from "@react-native-picker/picker";

// Accepted distance unit strings, used for state, props interface and function params
type DistanceUnit = "Km" | "M" | "Mi" | "Ft";

interface DistanceInputProps {
  value: string;
  saveDistance: (distanceObj: {
    distance: number;
    unit: DistanceUnit;
  }) => Promise<void>;
  validation: RegExp;
  inputStyle: StyleProp<TextStyle>;
  initialButtonStyle: StyleProp<ViewStyle>;
  initialButtonTextStyle: StyleProp<TextStyle>;
  focusStyle: StyleProp<TextStyle>;
  selectionColor: ColorValue;
  suffix: DistanceUnit;
}

/**
 * DistanceInput component for handling distance input with validation and unit selection.
 * The component displays a button with the current distance value and unit, which when pressed
 * opens a modal with input fields for the distance and unit. The distance input field is validated
 * using a regular expression, and the unit is selected from a cross-platform picker.
 * The component includes functions for saving and cancelling the input, and updates the distance
 * value in the parent component when saved. The component uses the SelectTextInput component for the
 * distance input field to avoid the need to add extra state and handling compared to TimeInput component.
 * The user can enter a decimal number for the distance and select a unit of measurement.
 * The distance value is saved in meters for easier caluclations and conversions elsewhere such as analytics.
 * The component uses a controlled component approach to manage the input states.
 * When the save button is pressed, the distance value is saved to the database by a DistanceInput specific
 * handling function in the parent and the modal is closed. When the cancel button or backdrop is pressed,
 * the value is reset and the modal is closed.
 *
 * @remarks
 * Unit functionality is not yet implemented, the suffix prop is used as a placeholder for the unit.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {string} props.value - The initial distance value.
 * @param {function({distance: number, unit: DistanceUnit}): Promise<void>} props.saveDistance - Function to save the distance value.
 * @param {RegExp} props.validation - Validation function for the distance input.
 * @param {StyleProp<TextStyle>} props.inputStyle - Style object for the input field.
 * @param {StyleProp<ViewStyle>} props.initialButtonStyle - Style object for the initial button.
 * @param {StyleProp<TextStyle>} props.initialButtonTextStyle - Style object for the initial button text.
 * @param {StyleProp<TextStyle>} props.focusStyle - Style object for the focused state.
 * @param {ColorValue} props.selectionColor - Color for the text selection.
 * @param {DistanceUnit} props.suffix - Suffix for the distance unit.
 *
 * @returns {JSX.Element} The rendered DistanceInput component.
 *
 * @example
 * ```tsx
 * <DistanceInput
 *  value={distance}
 *  saveDistance={saveDistance}
 *  validation={/^\d+(\.\d{1,2})?$/}
 *  inputStyle={styles.input}
 *  initialButtonStyle={styles.button}
 *  initialButtonTextStyle={styles.buttonText}
 *  focusStyle={styles.focus}
 *  selectionColor={"#60DD49"}
 *  suffix={"Km"}
 * />
 * ```
 */
const DistanceInput = ({
  value,
  saveDistance,
  validation,
  inputStyle,
  initialButtonStyle,
  initialButtonTextStyle,
  focusStyle,
  selectionColor,
  suffix,
}: DistanceInputProps): JSX.Element => {
  const [modalState, setModalState] = useState<boolean>(false);
  const [state, setState] = useState<{
    distance: string;
    distanceUnit: DistanceUnit | "";
  }>({ distance: "", distanceUnit: "" });

  // Set the state to the initial distance and unit values, when they change update the state with latest
  useEffect(() => {
    setState({
      distance: value,
      distanceUnit: suffix, // Set the distance unit to the suffix prop, this will be pulled from database
    });
  }, [value, suffix]);

  /**
   * Handles the change event for the distance input field.
   *
   * This function processes the input value to ensure it is in the correct format:
   * - If the input starts with a decimal point, a leading zero is added.
   * - Leading zeros are removed unless they are followed by a decimal point.
   *
   * @param {string} val - The input value as a string.
   * @returns {void}
   */
  const distanceOnChangeFunc = (val: string): void => {
    let processedVal = val;
    if (/^\.+\d*$/.test(processedVal)) {
      processedVal = val.padStart(val.length + 1, "0"); // Add leading zero if decimal point is first character
    }

    // Remove leading zeros, if it isnt followed by a decimal point it doesnt need to exist
    processedVal = processedVal.replace(/^0+(?!\.|$)/, "");

    setState({ ...state, distance: processedVal });
  };

  /**
   * Handles the blur event for the distance input field.
   *
   * If the distance state is an empty string, it sets the distance to "0".
   *
   * @remarks
   * Using the save to database onBlur method here is not ideal or recommended,
   * instead we may as well use the onBlur event to handle UX and minor validation.
   *
   * @returns {void}
   */
  const distanceOnBlurFunc = (): void => {
    if (state.distance === "") {
      setState({ ...state, distance: "0" });
    }
  };

  /**
   * Handles the save operation for the distance input.
   *
   * Converts the distance to a number and casts the unit as the
   * DistanceUnit type (see top of component file) before saving.
   * Closes the modal after saving.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the save operation is complete.
   */
  const handleSave = async (): Promise<void> => {
    await saveDistance({
      distance: Number(state.distance),
      // Cast to DistanceUnit type, accepted values "Km" | "M" | "Mi" | "Ft"
      unit: state.distanceUnit as DistanceUnit,
    });
    setModalState(false);
  };

  /**
   * Handles the cancel action for the distance input.
   *
   * Resets the state to the initial distance and unit values,
   * and closes the modal.
   *
   * @returns {void}
   */
  const handleCancel = (): void => {
    setState({ distance: value, distanceUnit: suffix });
    setModalState(false);
  };

  return (
    <>
      <Pressable
        style={[initialButtonStyle, modalState && focusStyle]}
        onPress={() => setModalState(true)}
      >
        <Text style={initialButtonTextStyle}>
          {value} {suffix}
        </Text>
      </Pressable>
      <Modal
        visible={modalState}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => handleCancel()}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => handleCancel()}>
          {/* Modal body, pressable is needed to negate parent as pointerEvents is not working as required or stated */}
          <Pressable style={styles.modalBody}>
            <View style={styles.inputContainer}>
              {/* Distance */}
              <View>
                <Text style={styles.inputTitle}>DISTANCE</Text>
                <SelectTextInput
                  inputType={"decimal"}
                  value={state.distance.toString()}
                  validation={validation}
                  onChangeFunc={(val) => distanceOnChangeFunc(val)}
                  onBlurFunc={distanceOnBlurFunc}
                  style={inputStyle}
                  focusStyle={focusStyle}
                  selectionColor={selectionColor}
                />
              </View>
              {/* Distance Unit */}
              <View>
                <Text style={styles.inputTitle}>UNIT</Text>
                <Picker
                  style={inputStyle}
                  selectedValue={state.distanceUnit}
                  onValueChange={(value) =>
                    setState({ ...state, distanceUnit: value })
                  }
                >
                  <Picker.Item label="Kilometres - Km" value="Km" />
                  <Picker.Item label="Metres - M" value="M" />
                  <Picker.Item label="Miles - Mi" value="Mi" />
                  <Picker.Item label="Feet - Ft" value="Ft" />
                </Picker>
              </View>
            </View>
            <View style={styles.modalButtonContainer}>
              <Pressable style={styles.saveButton} onPress={() => handleSave()}>
                <Text style={styles.buttonText}>SAVE</Text>
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={() => handleCancel()}
              >
                <Text style={styles.buttonText}>CANCEL</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default DistanceInput;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    width: "80%",
    minHeight: "35%",
    maxHeight: "70%",
    backgroundColor: "#292929",
    borderRadius: 10,
    gap: 32,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  inputTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputFocusStyles: { color: "black" },
  inputContainer: {
    flexGrow: 1,
    width: "100%",
    gap: 24,
    borderRadius: 10,
  },
  modalButtonContainer: { flexDirection: "row", gap: 16 },
  saveButton: {
    flex: 1,
    backgroundColor: "#60DD49",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#CD2C2C",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
