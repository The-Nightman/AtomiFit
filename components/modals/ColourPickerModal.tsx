import { ColorValue, Pressable, StyleSheet, Text, View } from "react-native";
import ModalBase from "./ModalBase";
import ColorPicker, {
  HueCircular,
  Panel1,
  Preview,
  Swatches,
} from "reanimated-color-picker";
import { useState } from "react";

interface ColourPickerModalProps {
  modalState: boolean;
  setModalState: React.Dispatch<React.SetStateAction<boolean>>;
  defaultColour?: ColorValue | string;
  setColour: (colour: ColorValue | string) => void;
}

/**
 * ColourPickerModal component allows users to pick a color from a color picker modal.
 *
 * @component
 * @param {ColourPickerModalProps} props - The properties object.
 * @param {boolean} props.modalState - The state of the modal (open/close).
 * @param {Function} props.setModalState - Function to set the state of the modal.
 * @param {string} props.defaultColour - The default color value.
 * @param {Function} props.setColour - Function to set the selected color.
 *
 * @returns {JSX.Element} The ColourPickerModal component.
 * 
 * @example
 * ```tsx
 * <ColourPickerModal
 *   modalState={modalState}
 *   setModalState={setModalState}
 *   defaultColour="#000000"
 *   setColour={(colour) => console.log(colour)}
 * />
 */
const ColourPickerModal = ({
  modalState,
  setModalState,
  defaultColour,
  setColour,
}: ColourPickerModalProps): JSX.Element => {
  const [selectedColour, setSelectedColour] = useState<ColorValue | string>(
    defaultColour ?? "#000000"
  );

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
    <ModalBase
      modalState={modalState}
      setModalState={() => setModalState(false)}
    >
      <View style={styles.modalBody}>
        <ColorPicker
          style={styles.colourPicker}
          value={defaultColour as string}
          onComplete={onSelectColor}
        >
          <Preview
            textStyle={{ textTransform: "uppercase" }}
            disableOpacityTexture={true}
          />
          <HueCircular
            style={{ width: "100%" }}
            containerStyle={[
              styles.hueCircleContainer,
              { backgroundColor: "#292929" },
            ]}
          >
            <Panel1 style={styles.panelStyle} />
          </HueCircular>
          <Swatches />
        </ColorPicker>
        <View style={styles.modalButtonContainer}>
          <Pressable
            onPress={() => {
              setModalState(false);
              setColour(defaultColour ?? "#000000");
            }}
            style={[styles.buttonBase, styles.cancelButton]}
          >
            <Text style={styles.buttonText}>CANCEL</Text>
          </Pressable>
          <Pressable
            style={[styles.buttonBase, styles.saveButton]}
            onPress={() => {
              setModalState(false);
              setColour(selectedColour);
            }}
          >
            <Text style={styles.buttonText}>SAVE</Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};

export default ColourPickerModal;

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
  colourPicker: { gap: 16 },
  hueCircleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  panelStyle: { width: "70%", height: "70%" },
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
