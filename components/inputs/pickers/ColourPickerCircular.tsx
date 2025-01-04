import { ColorValue, StyleSheet, View } from "react-native";
import ColorPicker, {
  HueCircular,
  InputWidget,
  Panel1,
  Swatches,
} from "reanimated-color-picker";
import { useState } from "react";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { getContrastTextColour } from "@/utils/getContrastTextColour";

interface ColourPickerCircularProps {
  defaultColour?: ColorValue | string;
  setColour: (colour: ColorValue | string) => void;
}

/**
 * ColourPickerCircular component allows users to pick a color using the reanimated color picker.
 *
 * @component
 * @param {ColourPickerCircularProps} props - The properties object.
 * @param {string} props.defaultColour - Optional default color value.
 * @param {Function} props.setColour - Function to set the selected color.
 * @param {Function} props.onCancel - Function to handle the cancel event.
 *
 * @returns {JSX.Element} The ColourPickerCircular component.
 *
 * @example
 * ```tsx
 * <ColourPickerCircular
 *   defaultColour="#000000"
 *   setColour={(colour) => console.log(colour)}
 * />
 */
const ColourPickerCircular = ({
  defaultColour = "#000000",
  setColour,
}: ColourPickerCircularProps): JSX.Element => {
  const [panelDimensions, setPanelDimensions] = useState(0);
  // These reanimated properties are so we can animate the style where appropriate and prevent errors from improper value access
  const animatedColour = useSharedValue(defaultColour as string);
  const backgroundAnimCol = useAnimatedStyle(() => ({
    backgroundColor: animatedColour.value,
  }));

  /**
   * Handles the selection of a color and updates the selected color state.
   *
   * @param {Object} param - The parameter object.
   * @param {string} param.hex - The hex value of the selected color.
   * @returns {void}
   */
  const onSelectColor = ({ hex }: { hex: string }): void => {
    setColour(hex);
  };

  return (
    <View onLayout={(e) => setPanelDimensions(e.nativeEvent.layout.width)}>
      <ColorPicker
        style={styles.colourPicker}
        value={defaultColour as string}
        onComplete={onSelectColor}
        onChange={(color) => {
          animatedColour.value = color.hex;
        }}
      >
        <HueCircular
          thumbShape="circle"
          style={{ width: "100%" }}
          containerStyle={[
            styles.hueCircleContainer,
            { backgroundColor: "#0F0F0F" },
          ]}
        >
          <Panel1
            // We need to do this to prevent an error caused by layout sizing on iOS or else the colour picker will break
            style={{
              width: panelDimensions * 0.55,
              height: panelDimensions * 0.55,
            }}
          />
        </HueCircular>
        <InputWidget
          inputStyle={[
            {
              color: getContrastTextColour(defaultColour as string),
              textTransform: "uppercase",
            },
            backgroundAnimCol,
          ]}
          formats={["HEX"]}
          inputTitleStyle={{ display: "none" }}
        />
        <Swatches />
      </ColorPicker>
    </View>
  );
};

export default ColourPickerCircular;

const styles = StyleSheet.create({
  colourPicker: { gap: 16 },
  hueCircleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
