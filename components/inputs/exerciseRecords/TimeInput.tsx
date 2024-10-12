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
import { TextInput } from "react-native-gesture-handler";
import { RefObject, useEffect, useRef, useState } from "react";
import { formatTime } from "@/utils/formatTime";

interface TimeInputProps {
  value: number;
  saveTime: (val: number) => Promise<void>;
  initialButtonStyle: StyleProp<ViewStyle>;
  initialButtonTextStyle: StyleProp<TextStyle>;
  inputStyle: StyleProp<TextStyle>;
  focusStyle: StyleProp<TextStyle>;
  inputContainerFocusColour: ColorValue;
  selectionColor: ColorValue;
}

interface TimeState {
  raw: number;
  focus: boolean;
  inputHours: string;
  inputMinutes: string;
  inputSeconds: string;
}

/**
 * TimeInput component allows users to input and save time in hours, minutes, and seconds.
 * The component displays the time in HH:MM:SS format and allows users to edit the time data of a set.
 * The component initially renders as a button displaying the current time value in HH:MM:SS format.
 * When the button is pressed, a modal is displayed with three input fields for hours, minutes, and seconds.
 * The user can input new values for each time unit and save the new time value.
 * The time value is saved in seconds for calcuations elsewhere and displayed in HH:MM:SS format.
 * The component uses a controlled component approach to manage the time value.
 * When the save button is pressed, the new time value is saved to the database by a TimeInput specific
 * handling fucntion in the parent and the modal is closed. When the close button is pressed,
 * the value is reset and the modal is closed.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {number} props.value - The initial time value in seconds.
 * @param {function(number): void} props.saveTime - The function to save the time value.
 * @param {StyleProp<ViewStyle>} props.initialButtonStyle - The style for the initial button.
 * @param {StyleProp<TextStyle>} props.initialButtonTextStyle - The style for the initial button text.
 * @param {StyleProp<TextStyle>} props.inputStyle - The style for the input fields.
 * @param {StyleProp<TextStyle>} props.focusStyle - The style applied when an input field is focused.
 * @param {ColorValue} props.inputContainerFocusColour - The background color for the input container when focused.
 * @param {ColorValue} props.selectionColor - The color of the text selection.
 *
 * @returns {JSX.Element} The rendered TimeInput component.
 *
 * @example
 * ```tsx
 * <TimeInput
 *  value={3600}
 *  saveTime={(val) => console.log(val)}
 *  initialButtonStyle={styles.button}
 *  initialButtonTextStyle={styles.buttonText}
 *  inputStyle={styles.input}
 *  focusStyle={styles.inputFocusStyles}
 *  inputContainerFocusColour={"#3F3C3C"}
 *  selectionColor={"#60DD49"}
 * />
 * ```
 */
const TimeInput = ({
  value,
  saveTime,
  initialButtonStyle,
  initialButtonTextStyle,
  inputStyle,
  focusStyle,
  inputContainerFocusColour,
  selectionColor,
}: TimeInputProps): JSX.Element => {
  const [modalState, setModalState] = useState<boolean>(false);
  const [state, setState] = useState<TimeState>({
    raw: value,
    focus: false,
    inputHours: "",
    inputMinutes: "",
    inputSeconds: "",
  });
  const hoursInputRef = useRef<TextInput>(null);
  const minutesInputRef = useRef<TextInput>(null);
  const secondsInputRef = useRef<TextInput>(null);

  // Initial state setup and guarantee the state is always updated with the latest value
  useEffect(() => {
    // Process value prop into its respective hours, minutes, and seconds converted from raw seconds data
    const { hours, minutes, seconds } = processTime(value);

    setState({
      ...state,
      raw: value, // raw value in seconds
      // Input specific values, padded with 0 if necessary
      inputHours: hours ? hours.toString().padStart(2, "0") : "",
      // Each subsequent value if the previous value is > 0 and if value is 0
      // then use padstart to replace with 00 string, if previous is blank and value is 0
      // then blank string to show placeholders
      inputMinutes: hours || minutes ? minutes.toString().padStart(2, "0") : "",
      inputSeconds:
        minutes || seconds ? seconds.toString().padStart(2, "0") : "",
    });
  }, [value]);

  /**
   * Converts a given number of seconds into an object containing hours, minutes, and seconds.
   *
   * @param {number} seconds - The total number of seconds to be converted.
   * @returns {Object} An object with the properties:
   *  - `hours`: The number of hours.
   *  - `minutes`: The number of minutes.
   *  - `seconds`: The remaining number of seconds.
   */
  const processTime = (
    seconds: number
  ): { hours: number; minutes: number; seconds: number } => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return { hours: hrs, minutes: mins, seconds: secs };
  };

  /**
   * Handles the change of time input values and updates the state accordingly.
   *
   * The function updates the state with the new value for the specified time unit and recalculates
   * the total time in seconds (`rawTime`). The state is updated with both the individual time units
   * and the total time in seconds.
   *
   * @param {string} val - The new value for the time unit.
   * @param {"hr"|"m"|"s"} unit - The unit of time being updated ("hr" for hours, "m" for minutes, "s" for seconds).
   * @returns {void}
   */
  const handleChange = (val: string, unit: "hr" | "m" | "s"): void => {
    setState((prevState) => {
      const updatedTime: TimeState = {
        ...prevState,
        // Update with the input value for the specified time unit
        [unit === "hr"
          ? "inputHours"
          : unit === "m"
          ? "inputMinutes"
          : "inputSeconds"]: val,
      };

      // Calculate the total time in seconds by casting input values to Int
      const rawTime =
        Number(updatedTime.inputHours) * 3600 +
        Number(updatedTime.inputMinutes) * 60 +
        Number(updatedTime.inputSeconds);

      return { ...updatedTime, raw: rawTime };
    });
  };

  /**
   * Handles the focus event for a TextInput component.
   * Sets the selection range of the input to the first two characters
   * and updates the component's state to indicate it is focused.
   *
   * @param {RefObject<TextInput>} ref - A reference to the TextInput component.
   * @returns {void}
   */
  const handleFocus = (ref: RefObject<TextInput>): void => {
    if (ref.current) {
      // Input maxLength is set to 2 as this is a time input
      ref.current.setSelection(0, 2);
    }
    setState({ ...state, focus: true });
  };

  /**
   * Handles the blur event for the time input fields.
   *
   * This function updates the component's state to:
   * - Set the focus to false.
   * - Pad the `inputHours` with leading zeros if it is a valid number.
   * - Pad the `inputMinutes` with leading zeros if either `inputHours` or `inputMinutes` is a valid number.
   * - Pad the `inputSeconds` with leading zeros if `inputHours`, `inputMinutes` or `inputSeconds` is a valid number.
   *
   * @returns {void}
   */
  const handleBlur = (): void => {
    setState({
      ...state,
      // Reset focus state for styles
      focus: false,
      // Pad input values with leading zeros if they are valid numbers, else blank string
      inputHours: Number(state.inputHours)
        ? state.inputHours.padStart(2, "0")
        : "",
      // If inputHours is a valid number or inputMinutes is a valid number, pad inputMinutes with leading zeros, else blank string
      inputMinutes:
        Number(state.inputHours) || Number(state.inputMinutes)
          ? state.inputMinutes.padStart(2, "0")
          : "",
      // If inputHours, inputMinutes, or inputSeconds are valid numbers, pad inputSeconds with leading zeros, else blank string
      inputSeconds:
        Number(state.inputHours) ||
        Number(state.inputMinutes) ||
        Number(state.inputSeconds)
          ? state.inputSeconds.padStart(2, "0")
          : "",
    });
  };

  /**
   * Checks if any of the time input fields (hours, minutes, or seconds) are focused.
   *
   * @returns {boolean} True if any of the input fields are focused, otherwise false.
   */
  const handleContainerFocusStyle = (): boolean => {
    if (
      hoursInputRef.current?.isFocused() ||
      minutesInputRef.current?.isFocused() ||
      secondsInputRef.current?.isFocused()
    ) {
      return true;
    }
    return false;
  };

  /**
   * Handles the save action for the time input.
   *
   * This function saves the current time from the state and then closes the modal.
   *
   * @returns {Promise<void>} A promise that resolves when the save operation is complete.
   */
  const handleSave = async (): Promise<void> => {
    await saveTime(state.raw);
    setModalState(false);
  };

  /**
   * Handles the cancel action for the time input modal.
   * 
   * This function processes the `value` prop into its respective hours, minutes,
   * and seconds, then updates the component state with these values effectively resetting it.
   * It also closes the modal by setting the modal state to false.
   * 
   * @returns {void}
   */
  const handleCancel = (): void => {
    // Process value prop into its respective hours, minutes, and seconds converted from raw seconds data
    const { hours, minutes, seconds } = processTime(value);

    setState({
      ...state,
      raw: value, // raw value in seconds
      // Input specific values, padded with 0 if necessary
      inputHours: hours ? hours.toString().padStart(2, "0") : "",
      // Each subsequent value if the previous value is > 0 and if value is 0
      // then use padstart to replace with 00 string, if previous is blank and value is 0
      // then blank string to show placeholders
      inputMinutes: hours || minutes ? minutes.toString().padStart(2, "0") : "",
      inputSeconds:
        minutes || seconds ? seconds.toString().padStart(2, "0") : "",
    });
    setModalState(false);
  }

  return (
    <>
      <Pressable
        style={[initialButtonStyle, modalState && focusStyle]}
        onPress={() => setModalState(true)}
      >
        <Text style={initialButtonTextStyle}>{formatTime(value)}</Text>
      </Pressable>
      <Modal
        visible={modalState}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setModalState(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalState(false)}
        >
          {/* Modal body, pressable is needed to negate parent as pointerEvents is not working as required or stated */}
          <Pressable style={styles.modalBody}>
            {/* Input container */}
            <View
              style={[
                styles.inputContainer,
                handleContainerFocusStyle() && {
                  backgroundColor: inputContainerFocusColour,
                },
              ]}
            >
              <TextInput
                keyboardType="numeric"
                value={state.inputHours}
                onChangeText={(text) => handleChange(text, "hr")}
                onFocus={() => handleFocus(hoursInputRef)}
                onBlur={() => handleBlur()}
                style={[
                  inputStyle,
                  hoursInputRef.current?.isFocused() && focusStyle,
                ]}
                selectionColor={selectionColor}
                placeholder="HH"
                placeholderTextColor={"gray"}
                maxLength={2}
                ref={hoursInputRef}
              />
              <Text style={inputStyle}> : </Text>
              <TextInput
                keyboardType="numeric"
                value={state.inputMinutes}
                onChangeText={(text) => handleChange(text, "m")}
                onFocus={() => handleFocus(minutesInputRef)}
                onBlur={() => handleBlur()}
                style={[
                  inputStyle,
                  minutesInputRef.current?.isFocused() && focusStyle,
                ]}
                selectionColor={selectionColor}
                placeholder="MM"
                placeholderTextColor={"gray"}
                maxLength={2}
                ref={minutesInputRef}
              />
              <Text style={inputStyle}> : </Text>
              <TextInput
                keyboardType="numeric"
                value={state.inputSeconds}
                onChangeText={(text) => handleChange(text, "s")}
                onFocus={() => handleFocus(secondsInputRef)}
                onBlur={() => handleBlur()}
                style={[
                  inputStyle,
                  secondsInputRef.current?.isFocused() && focusStyle,
                ]}
                selectionColor={selectionColor}
                placeholder="SS"
                placeholderTextColor={"gray"}
                maxLength={2}
                ref={secondsInputRef}
              />
            </View>
            <View style={styles.modalButtonContainer}>
              <Pressable style={styles.saveButton} onPress={() => handleSave()}>
                <Text style={styles.buttonText}>SAVE</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => handleCancel()}>
                <Text style={styles.buttonText}>CANCEL</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default TimeInput;

const styles = StyleSheet.create({
  modalBackdrop: {
    backgroundColor: "#00000066",
    height: "100%",
    width: "auto",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    backgroundColor: "#292929",
    borderRadius: 10,
    width: "80%",
    height: "30%",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  inputFocusStyles: { color: "black" },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#3F3C3C",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
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
