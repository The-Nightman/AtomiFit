import { ColorValue, Pressable, StyleSheet, Text, View } from "react-native";
import ColorPicker, {
  HueCircular,
  InputWidget,
  Panel1,
  Swatches,
} from "reanimated-color-picker";
import { useState } from "react";

interface ColourPickerCircularProps {
  defaultColour?: ColorValue | string;
  setColour: (colour: ColorValue | string) => void;
  onCancel: () => void;
}

/**
 * ColourPickerCircular component allows users to pick a color from a color picker modal.
 *
 * @component
 * @param {ColourPickerCircularProps} props - The properties object.
 * @param {string} props.defaultColour - Optional default color value.
 * @param {Function} props.setColour - Function to set the selected color.
 * @param {Function} props.onCancel - Function to handle the cancel event.
 *
 * @returns {JSX.Element} The ColourPickerModal component.
 *
 * @example
 * ```tsx
 * <ColourPickerModal
 *   defaultColour="#000000"
 *   setColour={(colour) => console.log(colour)}
 *   onCancel={() => console.log("Cancelled")}
 * />
 */
const ColourPickerCircular = ({
  defaultColour = "#000000",
  setColour,
  onCancel,
}: ColourPickerCircularProps): JSX.Element => {
  const [selectedColour, setSelectedColour] = useState<ColorValue | string>(
    defaultColour
  );
  const [panelDimensions, setPanelDimensions] = useState(0);

  /**
   * Handles the selection of a color and updates the selected color state.
   *
   * @param {Object} param - The parameter object.
   * @param {string} param.hex - The hex value of the selected color.
   * @returns {void}
   */
  const onSelectColor = ({ hex }: { hex: string }): void => {
    setSelectedColour(hex);
  };

  return (
    <View onLayout={(e) => setPanelDimensions(e.nativeEvent.layout.width)}>
      <ColorPicker
        style={styles.colourPicker}
        value={selectedColour as string}
        onComplete={onSelectColor}
      >
        <HueCircular
          thumbShape="circle"
          style={{ width: "100%" }}
          containerStyle={[
            styles.hueCircleContainer,
            { backgroundColor: "#292929" },
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
          inputStyle={{
            backgroundColor: selectedColour as string,
            textTransform: "uppercase",
          }}
          formats={["HEX"]}
          inputTitleStyle={{ display: "none" }}
        />
        <Swatches />
      </ColorPicker>
      <View style={styles.modalButtonContainer}>
        <Pressable
          onPress={() => onCancel()}
          style={[styles.buttonBase, styles.cancelButton]}
        >
          <Text style={styles.buttonText}>CANCEL</Text>
        </Pressable>
        <Pressable
          style={[styles.buttonBase, styles.saveButton]}
          onPress={() => setColour((selectedColour as string).slice(0, 7))}
        >
          <Text style={styles.buttonText}>SAVE</Text>
        </Pressable>
      </View>
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
  modalButtonContainer: { flexDirection: "row", gap: 16 },
  buttonBase: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#60DD49",
  },
  cancelButton: {
    backgroundColor: "#CD2C2C",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
