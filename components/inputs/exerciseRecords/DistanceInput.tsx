import { ColorValue, StyleProp, TextStyle } from "react-native";
import SelectTextInput from "../SelectTextInput";

interface DistanceInputProps {
  value: string;
  validation: RegExp;
  onChangeFunc: (val: string) => void;
  onBlurFunc: () => void;
  style: StyleProp<TextStyle>;
  focusStyle: StyleProp<TextStyle>;
  selectionColor: ColorValue;
  suffix: string;
}

const DistanceInput = ({
  value,
  validation,
  onChangeFunc,
  onBlurFunc,
  style,
  focusStyle,
  selectionColor,
  suffix,
}: DistanceInputProps) => {
  return (
    <SelectTextInput
      inputType={"decimal"}
      value={value}
      validation={validation}
      onChangeFunc={onChangeFunc}
      onBlurFunc={onBlurFunc}
      style={style}
      focusStyle={focusStyle}
      selectionColor={selectionColor}
      suffix={suffix} // This will be pulled from database later
    />
  );
};

export default DistanceInput;
