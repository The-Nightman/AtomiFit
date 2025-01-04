import { ColorValue, StyleSheet, Text } from "react-native";
import { useEffect, useRef } from "react";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

interface ToastProps {
  message: string;
  colour: ColorValue;
  autoDismiss?: () => void;
  autoDismissTime?: number;
}

/**
 * Toast component to display a temporary message.
 *
 * The toast component makes use of react-native-reanimated to animate the toast on mount and dismount.
 * @remarks This components visibility should be controlled in the parent component by means of conditional rendering.
 *
 * @component
 * @param {ToastProps} props - The props for the component.
 * @param {string} props.message - The message to display inside the toast.
 * @param {ColorValue} props.colour - The background color of the toast.
 * @param {() => void} props.autoDismiss - (optional) Function to call to dismiss the toast automatically.
 * @param {number} [props.autoDismissTime=3000] - (optional) Time in milliseconds before the toast is automatically dismissed.
 *
 * @returns {JSX.Element} The rendered toast component.
 * @example
 * ```tsx
 * {showToast && <Toast message="This is a toast message" colour="#FF0000" />}
 * ```
 */
const Toast = ({
  message,
  colour,
  autoDismiss,
  autoDismissTime,
}: ToastProps): JSX.Element => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoDismiss) {
      timerRef.current = setTimeout(() => {
        autoDismiss();
      }, autoDismissTime ?? 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      style={[styles.toast, { backgroundColor: colour, zIndex: 0 }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  toast: {
    position: "absolute", // This is to make sure the toast is on top of everything and doesnt disrupt flow
    width: "100%",
    padding: 6,
    zIndex: 1000,
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
