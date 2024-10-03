import { memo, useEffect, useRef, useState } from "react";
import {
  ColorValue,
  InputModeOptions,
  StyleProp,
  TextStyle,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";

interface SelectTextInputProps {
  inputType: InputModeOptions;
  value: string;
  validation?: RegExp;
  onChangeFunc: (val: string) => void;
  onBlurFunc: () => void;
  style: StyleProp<TextStyle>;
  focusStyle?: StyleProp<TextStyle>;
  selectionColor?: ColorValue;
  suffix?: string;
}

/**
 * SelectTextInput is a custom text input component that manages its own focus state and selection behavior.
 * It uses a controlled component approach to handle the input value.
 *
 * @component
 * @param {SelectTextInputProps} props - The properties object.
 * @param {InputModeOptions} props.inputType - The type of input mode to use.
 * @param {string} props.value - The current value of the text input.
 * @param {RegExp} props.validation - The regular expression to validate the text input value, optional.
 * @param {function(string): void} props.onChangeFunc - Function to call when the text input value changes.
 * @param {function} props.onBlurFunc - Function to call when the text input loses focus.
 * @param {StyleProp<TextStyle>} props.style - The style to apply to the text input.
 * @param {StyleProp<TextStyle>} props.focusStyle - The style to apply to the text input when it is focused, optional.
 * @param {ColorValue} props.selectionColor - The color of the text selection, optional.
 * @param {string} props.suffix - The suffix to append to the text input value when unfocused, directly applied without post-declared whitespace, optional.
 *
 * @returns {JSX.Element} The rendered text input component.
 *
 * @example
 * ```tsx
 * <SelectTextInput
 *  inputType="numeric"
 *  value="10"
 *  validation={/^\d+$/}
 *  onChangeFunc={(val) => console.log(val)}
 *  onBlurFunc={() => console.log("Blur")}
 *  style={styles.input}
 *  focusStyle={styles.inputFocused}
 *  selectionColor="#000"
 *  suffix=" kg"
 * />
 */
const SelectTextInput = memo(
  ({
    inputType,
    value,
    validation,
    onChangeFunc,
    onBlurFunc,
    style,
    focusStyle,
    selectionColor,
    suffix,
  }: SelectTextInputProps): JSX.Element => {
    const [state, setState] = useState<{ val: string; focused: boolean }>({
      val: value,
      focused: false,
    });
    const textInputRef = useRef<TextInput>(null);

    // Guarantee that the state.val property is always up to date.
    useEffect(() => {
      setState({ ...state, val: value }); // No suffix operations here as value is a prop from parent
    }, [value]);

    // Apply the suffix to the input value when the component is first rendered.
    // This loop must be declared after any dependency loops to avoid being overwritten.
    useEffect(() => {
      // If a suffix is provided, then append it, if not just skip
      if (suffix) {
        setState({ ...state, val: `${value}${suffix}` });
      }
    }, []);

    /**
     * Handles the focus event on the text input.
     * Updates the component's state to indicate that the input is focused.
     * Additionally, it sets the selection range of the text input to highlight the entire text.
     * If a suffix is provided, it will be removed from the input value.
     *
     * @returns {void}
     */
    const handleFocus = (): void => {
      if (suffix) {
        setState({ val: state.val.replace(suffix, ""), focused: true });
      } else {
        setState({ ...state, focused: true });
      }
      if (textInputRef.current) {
        textInputRef.current.setSelection(0, state.val.length);
      }
    };

    /**
     * Handles the blur event for the input field.
     * Updates the component's state to indicate that the input field
     * is no longer focused and then calls the provided `onBlurFunc` callback.
     * If a suffix is provided, it will be appended to the input value.
     *
     * @returns {void}
     */
    const handleBlur = (): void => {
      if (suffix) {
        setState({ val: `${state.val}${suffix}`, focused: false });
      } else {
        setState({ ...state, focused: false });
      }
      onBlurFunc();
    };

    /**
     * Handles the change event for a text input.
     * If a validation regular expression is provided, it will be used to validate the input.
     * If the input is invalid, the input value will be reset to the value prop.
     * If a suffix is provided, it will be removed from the input value before calling the `onChangeFunc`.
     *
     * @param {string} text - The new text value from the input.
     *
     * @returns {void}
     */
    const handleChange = (text: string): void => {
      // If a validation regular expression is provided, validate the input.
      if (validation && !validation.test(text)) {
        // If the input is invalid, reset the input value to the value prop and return early.
        setState({ ...state, val: value });
        return;
      }
      // If a suffix is provided, remove it from the input value before calling the onChangeFunc.
      if (suffix) {
        setState({ ...state, val: text.replace(suffix, "") });
      } else {
        setState({ ...state, val: text });
      }

      onChangeFunc(text);
    };

    return (
      <TextInput
        inputMode={inputType}
        value={state.val}
        onChangeText={(text) => handleChange(text)}
        onFocus={() => handleFocus()}
        onBlur={() => handleBlur()}
        style={[style, state.focused && focusStyle]}
        selectionColor={selectionColor}
        ref={textInputRef}
      />
    );
  }
);

export default SelectTextInput;
