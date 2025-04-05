import { useTimer } from "@/contexts/timerContext";
import { getContrastTextColour } from "@/utils/getContrastTextColour";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  AnimatedProps,
  FadeIn,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

/**
 * A functional component that renders a timer interface screen with play, pause, resume, and cancel functionalities.
 *
 * @remarks
 * This component utilizes the `useTimer` hook to manage timer states and actions. It includes
 * an animated button for starting, pausing, resuming, and canceling the timer, as well as a
 * formatted display of the remaining time. The component also provides additional buttons
 * for canceling the timer or editing the timer settings, which are conditionally rendered
 * based on the timer's state.
 *
 * @returns {JSX.Element} The rendered timer screen.
 */
const timer = (): JSX.Element => {
  const { timerState, startTimer, pauseTimer, resumeTimer, cancelTimer } =
    useTimer();

  /**
   * An animated version of the `Pressable` component.
   *
   * @remarks
   * This component is created using `Animated.createAnimatedComponent` and is memoized
   * to ensure it is only created once during the screen's lifecycle, without memoization
   * the component is redefined and the animations are triggered every render.
   */
  const AnimatedPressable: React.FunctionComponent<
    AnimatedProps<PressableProps & React.RefAttributes<View>>
  > = useMemo(() => Animated.createAnimatedComponent(Pressable), []);

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
      <View style={styles.relativeContainer}>
        <View style={styles.timerContainer}>
          <Pressable
            style={styles.playPauseButton}
            onPress={() => {
              if (timerState.active === false) {
                startTimer();
                return;
              }
              if (timerState.active === true) {
                pauseTimer();
                return;
              }
              if (timerState.active === "paused") {
                resumeTimer();
                return;
              }
            }}
          >
            {({ pressed }) => {
              const colour: string = getContrastTextColour("#60DD49");
              const pressedColour =
                colour === "#000000"
                  ? hexcodeLuminosity("#000000", 90)
                  : hexcodeLuminosity("#FFFFFF", -90);

              if (timerState.active !== true)
                return (
                  <Entypo
                    name="controller-play"
                    size={70}
                    color={pressed ? pressedColour : colour}
                  />
                );
              if (timerState.active === true)
                return (
                  <Entypo
                    name="controller-paus"
                    size={70}
                    color={pressed ? pressedColour : colour}
                  />
                );
            }}
          </Pressable>
          <Text
            maxFontSizeMultiplier={1.6} // Bad for accessibility however font size is already large even at 0.8 scale so this should be offset
            style={styles.timerTime}
          >
            {formatRestTime(
              timerState.active ? timerState.time : timerState.selectedTime
            )}
          </Text>
        </View>
        <View style={styles.controlsContainer}>
          {timerState.active !== false && (
            <AnimatedPressable
              entering={FadeIn}
              exiting={FadeOutUp}
              layout={LinearTransition}
              style={styles.cancelButton}
              onPress={() => cancelTimer()}
            >
              <Entypo name="controller-stop" size={32} color={"red"} />
              <Text style={styles.cancelText}>CANCEL</Text>
            </AnimatedPressable>
          )}
          {timerState.active !== true && (
            <AnimatedPressable
              entering={FadeIn}
              exiting={FadeOutUp}
              layout={LinearTransition}
              style={styles.editButton}
              onPress={() => {}}
            >
              <MaterialCommunityIcons
                name="clock-edit-outline"
                size={32}
                color={"deepskyblue"}
              />
              <Text style={styles.editText}>EDIT</Text>
            </AnimatedPressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default timer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  relativeContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },
  timerContainer: {
    minWidth: "80%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 4,
    padding: 10,
    borderRadius: 3000,
    borderWidth: 0.5,
    borderColor: hexcodeLuminosity("#60DD49", -50),
    backgroundColor: "#60DD49",
  },
  timerTime: {
    color: getContrastTextColour("#60DD49"),
    fontSize: 70,
    fontWeight: "bold",
  },
  playPauseButton: { minHeight: 44, minWidth: 44 },
  controlsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 16,
    position: "absolute",
    top: "110%",
    justifyContent: "center",
    zIndex: -200, // This will keep the buttons below the timer when animating
  },
  cancelButton: {
    flexDirection: "row",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderColor: "red",
    borderWidth: 2,
    borderRadius: 3000,
  },
  cancelText: { color: "red", fontSize: 20, fontWeight: "bold" },
  editButton: {
    flexDirection: "row",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderColor: "deepskyblue",
    borderWidth: 2,
    borderRadius: 3000,
  },
  editText: {
    color: "deepskyblue",
    fontSize: 20,
    fontWeight: "bold",
  },
});
