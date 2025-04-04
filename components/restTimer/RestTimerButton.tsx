import { Pressable, StyleSheet, Text, View } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { getContrastTextColour } from "@/utils/getContrastTextColour";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useTimer } from "@/contexts/timerContext";

/**
 * RestTimerButton Component
 *
 * A functional React component that provides a button for managing a rest timer.
 * The button allows users to start the timer and displays the formatted time
 * remaining or selected for the timer.
 *
 * @component
 *
 * @remarks
 * - The component uses the `useTimer` hook to access the timer context.
 * - The internal `formatRestTime` function is used to format the timer's value to a readable MM:SS format.
 * - The text color of the button is determined by the `getContrastTextColour` utility for better readability.
 *
 * @returns {JSX.Element} A styled button that displays the timer and allows access to timer controls.
 *
 * @example
 * ```tsx
 * import RestTimerButton from './RestTimerButton';
 *
 * const App = () => (
 *   <View>
 *     <RestTimerButton />
 *   </View>
 * );
 * ```
 */
const RestTimerButton = (): JSX.Element => {
  const { startTimer, pauseTimer, cancelTimer, timerState } = useTimer();

  /**
   * Formats the given time in seconds into a string representation of minutes, and seconds.
   * 
   * @remarks This function is identical to the formatTime function in utils/formatTime.ts
   * However, this function has been extrapolated use in the RestTimerButton component as
   * the function of calculating and representing hours is not needed in this case, 
   * and to prevent any unexpected behaviour using str.Slice() is not appropriate.
   *
   * @param {number} seconds - The time in seconds to format.
   * @returns {string} A string representation of the formatted time in a MM:SS format.
   */
  const formatRestTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed
              ? hexcodeLuminosity("#60DD49", -30)
              : "#60DD49",
          },
        ]}
        onPress={() => startTimer()}
      >
        <Entypo
          name="stopwatch"
          size={16}
          color={getContrastTextColour("#60DD49")}
        />
        <Text>
          {formatRestTime(
            timerState.active ? timerState.time : timerState.selectedTime
          )}
        </Text>
      </Pressable>
    </View>
  );
};

export default RestTimerButton;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "35%",
    height: 60,
  },
  button: {
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 4,
    padding: 10,
    borderRadius: 3000,
    borderWidth: 0.5,
    borderColor: hexcodeLuminosity("#60DD49", -40),
  },
});
