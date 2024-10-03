import { ColorValue, StyleProp, TextStyle } from "react-native";
import SelectTextInput from "../SelectTextInput";

interface RepsInputProps {
  value: string;
  onChangeFunc: (val: string) => void;
  onBlurFunc: () => void;
  style: StyleProp<TextStyle>;
  focusStyle: StyleProp<TextStyle>;
  selectionColor: ColorValue;
  suffix: string;
}

/**
 * RepsInput component for handling reps input with specific RegExp validation.
 * It uses the SelectTextInput component for extra control of focus and blur states.
 * The hardcoded RegExp validation is set to allow only integers.
 * The suffix is currently not hardcoded to allow flexibility and will be appended 
 * to the input value when the input is not focused, directly applied without 
 * post-declared whitespace. 
 * The input type is hardcoded to decimal.
 *
 * @component
 * @param {object} props - The properties object.
 * @param {string} props.value - The current value of the input.
 * @param {function(string): void} props.onChangeFunc - The function to call when the input value changes.
 * @param {function(): void} props.onBlurFunc - The function to call when the input loses focus.
 * @param {StyleProp<TextStyle>} props.style - The style object for the input field.
 * @param {StyleProp<TextStyle>} props.focusStyle - The style object for the input field when it is focused.
 * @param {ColorValue} props.selectionColor - The color of the text selection.
 * @param {string} props.suffix - The suffix to display after the input value (e.g., "reps").
 *
 * @returns {JSX.Element} The rendered RepsInput component.
 *
 * @example
 * ```tsx
 * <RepsInput
 *  value="10"
 *  onChangeFunc={onChangeFunc} // Pass the function not invoke it
 *  onBlurFunc={onBlurFunc} // Pass the function not invoke it
 *  style={styles.input}
 *  focusStyle={styles.inputFocused}
 *  selectionColor="#000"
 *  suffix=" reps"
 * />
 */
const RepsInput = ({
  value,
  onChangeFunc,
  onBlurFunc,
  style,
  focusStyle,
  selectionColor,
  suffix,
}: RepsInputProps): JSX.Element => {
  return (
    <SelectTextInput
      inputType={"decimal"}
      value={value}
      validation={/^\d*$/} // Int validation
      onChangeFunc={onChangeFunc}
      onBlurFunc={onBlurFunc}
      style={style}
      focusStyle={focusStyle}
      selectionColor={selectionColor}
      suffix={suffix} // This is subject to change, will not be pulled from DB however it may be localized if possible
    />
  );
};

export default RepsInput;
