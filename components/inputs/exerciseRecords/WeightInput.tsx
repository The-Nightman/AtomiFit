import { ColorValue, StyleProp, TextStyle } from "react-native";
import SelectTextInput from "../SelectTextInput";

interface WeightInputProps {
  value: string;
  onChangeFunc: (val: string) => void;
  onBlurFunc: () => void;
  style: StyleProp<TextStyle>;
  focusStyle: StyleProp<TextStyle>;
  selectionColor: ColorValue;
  suffix: string;
}

/**
 * WeightInput component for handling weight input with specific RegExp validation.
 * It uses the SelectTextInput component for extra control of focus and blur states.
 * The harcoded RegExp validation is set to allow only numbers and up to two decimal places.
 * The suffix is pulled from the database and will be appended to the input value when
 * the input is not focused, directly applied without post-declared whitespace.
 * The input type is hardcoded to decimal.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {string} props.value - The current value of the input.
 * @param {function(string): void} props.onChangeFunc - The function to call when the input value changes.
 * @param {function(): void} props.onBlurFunc - The function to call when the input loses focus.
 * @param {StyleProp<TextStyle>} props.style - The style object for the input.
 * @param {StyleProp<TextStyle>} props.focusStyle - The style object for the input when focused.
 * @param {ColorValue} props.selectionColor - The color of the text selection.
 * @param {string} props.suffix - The suffix to display after the input value.
 *
 * @returns {JSX.Element} The rendered WeightInput component.
 *
 * @example
 * ```tsx
 * <WeightInput
 *  value="10"
 *  onChangeFunc={onChangeFunc} // Pass the function not invoke it
 *  onBlurFunc={onBlurFunc} // Pass the function not invoke it
 *  style={styles.input}
 *  focusStyle={styles.inputFocused}
 *  selectionColor="#000"
 *  suffix=" kg"
 * />
 */
const WeightInput = ({
  value,
  onChangeFunc,
  onBlurFunc,
  style,
  focusStyle,
  selectionColor,
  suffix,
}: WeightInputProps): JSX.Element => {
  return (
    <SelectTextInput
      inputType={"decimal"}
      value={value}
      validation={/^\d*\.?\d{0,2}$/} // Int or float validation
      //! must allow floats without leading digits or else MAJOR inconvenience to user so extra validation is needed
      onChangeFunc={onChangeFunc}
      onBlurFunc={onBlurFunc}
      style={style}
      focusStyle={focusStyle}
      selectionColor={selectionColor}
      suffix={suffix} // This will be pulled from database later
    />
  );
};

export default WeightInput;
