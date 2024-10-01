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
 *
 * @returns {JSX.Element} The rendered text input component.
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
  }: SelectTextInputProps): JSX.Element => {
    const [state, setState] = useState<{ val: string; focused: boolean }>({
      val: value,
      focused: false,
    });
    const textInputRef = useRef<TextInput>(null);

    // Guarantee that the state.val property is always up to date.
    useEffect(() => {
      setState({ ...state, val: value });
    }, [value]);

    /**
     * Handles the focus event on the text input.
     * Updates the component's state to indicate that the input is focused.
     * Additionally, it sets the selection range of the text input to highlight the entire text.
     * 
     * @returns {void}
     */
    const handleFocus = (): void => {
      setState({ ...state, focused: true });
      if (textInputRef.current) {
        textInputRef.current.setSelection(0, state.val.length);
      }
    };

    /**
     * Handles the blur event for the input field.
     * Updates the component's state to indicate that the input field
     * is no longer focused and then calls the provided `onBlurFunc` callback.
     * 
     * @returns {void}
     */
    const handleBlur = (): void => {
      setState({ ...state, focused: false });
      onBlurFunc();
    };

    /**
     * Handles the change event for a text input.
     * If a validation regular expression is provided, it will be used to validate the input.
     * If the input is invalid, the input value will be reset to the value prop.
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
        setState({ ...state, val: text });
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
