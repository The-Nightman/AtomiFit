import { Pressable, StyleSheet, Text } from "react-native";

interface PickeriOSButtonProps {
  text: string;
  onPress: () => void;
}

/**
 * A button component designed to visually match the iOS-14 style picker component from @react-native-picker/picker.
 *
 * @remarks This component was designed to be used to emit an event to open the BottomSheetPickeriOS component.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {string} props.text - The text to display on the button.
 * @param {function} props.onPress - The function to call when the button is pressed.
 *
 * @example
 * ```tsx
 * <PickeriOSButton
 *   text="Select Event"
 *   onPress={() => console.log('Button pressed')}
 * />
 * ```
 */
const PickeriOSButton = ({ text, onPress }: PickeriOSButtonProps) => {
  return (
    <Pressable style={styles.button} onPress={() => onPress()}>
      {({ pressed }) => (
        <Text
          style={[
            styles.text,
            { backgroundColor: pressed ? "#3F3C3C99" : "#3F3C3C40" }, // This should not be changed as this is a finely tuned match to the iOS picker component
          ]}
        >
          {text}
        </Text>
      )}
    </Pressable>
  );
};

export default PickeriOSButton;

const styles = StyleSheet.create({
  button: {
    marginVertical: 16,
    padding: 10,
  },
  text: {
    textAlign: "center",
    width: "100%",
    color: "white",
    fontSize: 22,
    padding: 10,
    borderRadius: 10,
  },
});
