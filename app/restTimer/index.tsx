import { useTimer } from "@/contexts/timerContext";
import { getContrastTextColour } from "@/utils/getContrastTextColour";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated, {
  AnimatedProps,
  EntryAnimationsValues,
  ExitAnimationsValues,
  FadeIn,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  SharedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const ANIM_DELAY = 0;
const ANIM_DURATION = 200;
const ANIM_DISTANCE = 80;

/**
 * A functional component that renders a timer interface screen with play, pause, resume, edit, and cancel functionalities.
 *
 * @remarks
 * This component utilizes the `useTimer` hook to manage timer states and actions. It includes
 * an animated button for starting, pausing, resuming, and canceling the timer, as well as a
 * formatted display of the remaining time. The component also provides additional buttons
 * for canceling the timer or editing the timer settings, which are conditionally rendered
 * based on the timer's state.
 * The edit controls allow the user to adjust the timer value in increments of 10 seconds or
 * directly set a time in seconds with a text input. Upon pressing the edit button, the timer
 * is canceled if paused, and the edit controls are displayed. If the play/pause button is pressed,
 * the edit controls are hidden, and the timer starts accordingly.
 *
 * @returns {JSX.Element} The rendered timer screen.
 */
const timer = (): JSX.Element => {
  const [editState, setEditState] = useState<boolean>(false);
  const editInputRef = useRef<TextInput>(null);
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    setTimer,
  } = useTimer();

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

  /**
   * A collection of shared value that tracks whether the respective elements are mounted.
   *
   * @remarks This is used to determine if the component should animate on mount.
   * These are intended to be used with custom animations and as such changes should
   * ideally be tracked via key props.
   */
  const isMinutesMounted = useSharedValue(false);
  const isTenMinutesMounted = useSharedValue(false);
  const isSecondsMounted = useSharedValue(false);
  const isTenSecondsMounted = useSharedValue(false);

  /**
   * Custom entry animation function.
   *
   * @remarks The function takes a shared value indicating whether it is the first render.
   * The `values` object is passed to the function via the `react-native-reanimated` element `entering` prop.
   * The function returns an object with `initialValues` and `animations`:
   * - `initialValues`: The starting values for the animation.
   * - `animations`: The animation configurations to transition to the target values.
   * If it is the first render, the function initializes `isFirstRender` to `true` and returns the
   * originY value of the `values` object as the initial value and the animation configurations, returning
   * these fixes an issue on iOS where the text would be rendered on first render. Otherwise, it
   * calculates the animation for the `originY` property with a delay and a timing function.
   *
   * *refactor and sourced from: rgommezz/react-native-reanimated-stopwatch-timer
   *
   * @param {SharedValue<boolean>} isFirstRender - A shared value indicating whether it is the first render.
   * @returns An object containing entry animation values and configurations.
   */
  const createEntering =
    (isFirstRender: SharedValue<boolean>) =>
    (values: EntryAnimationsValues) => {
      "worklet";

      const animations = {
        originY: withDelay(
          ANIM_DELAY,
          withTiming(values.targetOriginY, {
            duration: ANIM_DURATION,
          })
        ),
      };

      const enterDirection = -1;
      const initialValues = {
        originY: values.targetOriginY + ANIM_DISTANCE * enterDirection,
      };

      // We need to return this here instead of at the start of the function to fix the iOS issue
      if (!isFirstRender.value) {
        isFirstRender.value = true;
        return {
          initialValues: { originY: values.targetOriginY },
          animations: animations,
        };
      }

      return { initialValues, animations };
    };

  /**
   * Custom exit animation function.
   *
   * @remarks This function recieves the `values` object from the `react-native-reanimated` exiting prop.
   * The function returns an object with `initialValues` and `animations`:
   * - `initialValues`: The starting values for the animation.
   * - `animations`: The animation configurations to transition to the target values.
   * The function uses these values and configurations to animate elements in the antagonistic direction
   * to the entry animation function creating a scrolling effect in the specified direction.
   *
   * *sourced from: rgommezz/react-native-reanimated-stopwatch-timer
   *
   * @param {ExitAnimationsValues} values - An object containing exit animation values from the exiting prop.
   * @returns An object containing exit animation values and configurations.
   */
  const createExiting = (values: ExitAnimationsValues) => {
    "worklet";
    const exitDirection = 1;
    const animations = {
      originY: withTiming(
        values.currentOriginY + ANIM_DISTANCE * exitDirection,
        {
          duration: ANIM_DURATION,
        }
      ),
    };

    const initialValues = {
      originY: values.currentOriginY,
    };
    return { initialValues, animations };
  };

  /**
   * Memoized calculation of timer digits based on the current timer state.
   *
   * @remarks This function is intended to reduce the workload by reducing the number of
   * calculations and string manipulations with the `formatRestTime` function and congregate
   * the values into one single location for better maintainability. This function formats
   * the remaining time into a string and extracts individual time components (ten minutes,
   * minutes, ten seconds, and seconds) for display purposes.
   *
   * @returns {{ tenMinutes: string; minutes: string; tenSeconds: string; seconds: string; }}
   *  An object containing the following properties:
   * - `tenMinutes`: The tens place of the minutes digit (e.g., "0" in "01:23").
   * - `minutes`: The single minutes digit (e.g., "1" in "01:23").
   * - `tenSeconds`: The tens place of the seconds digit (e.g., "2" in "01:23").
   * - `seconds`: The single seconds digit (e.g., "3" in "01:23").
   */
  const timerDigits = useMemo(() => {
    const formattedTime = formatRestTime(Math.max(timerState.time, 0));
    return {
      tenMinutes: formattedTime.slice(0, 1),
      minutes: formattedTime.slice(1, 2),
      tenSeconds: formattedTime.slice(-2, -1),
      seconds: formattedTime.slice(-1),
    };
  }, [timerState.time]);

  return (
    <View
      style={styles.container}
      onTouchStart={() => {
        if (editInputRef.current) editInputRef.current.blur();
      }}
    >
      <View style={styles.relativeContainer}>
        <Animated.View
          layout={LinearTransition}
          style={styles.timerContainer}
          onTouchStart={(e) => e.stopPropagation()} // This will prevent the touch event from the parent firing in children without interfering with child pressables
        >
          <AnimatedPressable
            layout={LinearTransition}
            style={styles.playPauseButton}
            onPress={() => {
              setEditState(false);
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
          </AnimatedPressable>
          {editState && timerState.active === false ? (
            <TextInput
              style={[styles.timerTime, { padding: 0 }]}
              keyboardType="numeric"
              value={String(timerState.selectedTime)}
              onChangeText={(text) => {
                if (!text) setTimer(1);
                const value = parseInt(text);
                if (isNaN(value)) return;
                setTimer(value);
              }}
              onFocus={() => {
                if (editInputRef.current) {
                  editInputRef.current.setSelection(
                    0,
                    String(timerState.selectedTime).length
                  );
                }
              }}
              ref={editInputRef}
            />
          ) : (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.Text
                key={`tenMinutes-${timerDigits.tenMinutes}`}
                entering={createEntering(isTenMinutesMounted)}
                exiting={createExiting}
                maxFontSizeMultiplier={1.6} // Bad for accessibility however font size is already large even at 0.8 scale so this should be offset
                style={styles.timerTime}
              >
                {timerDigits.tenMinutes}
              </Animated.Text>
              <Animated.Text
                key={`minutes-${timerDigits.minutes}`}
                entering={createEntering(isMinutesMounted)}
                exiting={createExiting}
                maxFontSizeMultiplier={1.6} // Bad for accessibility however font size is already large even at 0.8 scale so this should be offset
                style={styles.timerTime}
              >
                {timerDigits.minutes}
              </Animated.Text>
              <Text maxFontSizeMultiplier={1.6} style={styles.timerTime}>
                :
              </Text>
              <Animated.Text
                key={`tenSeconds-${timerDigits.tenSeconds}`}
                entering={createEntering(isTenSecondsMounted)}
                exiting={createExiting}
                maxFontSizeMultiplier={1.6} // Bad for accessibility however font size is already large even at 0.8 scale so this should be offset
                style={styles.timerTime}
              >
                {timerDigits.tenSeconds}
              </Animated.Text>
              <Animated.Text
                key={`seconds-${timerDigits.seconds}`}
                entering={createEntering(isSecondsMounted)}
                exiting={createExiting}
                maxFontSizeMultiplier={1.6} // Bad for accessibility however font size is already large even at 0.8 scale so this should be offset
                style={styles.timerTime}
              >
                {timerDigits.seconds}
              </Animated.Text>
            </View>
          )}
        </Animated.View>
        {editState && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                minWidth: "60%",
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 16,
                  justifyContent: "space-evenly",
                  alignItems: "center",
                }}
              >
                <Pressable
                  style={{
                    backgroundColor: "#60DD49",
                    borderRadius: 4,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => setTimer(timerState.selectedTime - 10)}
                >
                  <MaterialIcons name="remove" size={38} color={"#0F0F0F"} />
                </Pressable>
                <MaterialIcons name="timer-10" size={38} color={"#60DD49"} />
                <Pressable
                  style={{
                    backgroundColor: "#60DD49",
                    borderRadius: 4,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => setTimer(timerState.selectedTime + 10)}
                >
                  <MaterialIcons name="add" size={38} color={"#0F0F0F"} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
        <Animated.View
          layout={LinearTransition}
          style={styles.controlsContainer}
        >
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
              onPress={() => {
                cancelTimer();
                setEditState(!editState);
              }}
            >
              <MaterialCommunityIcons
                name="clock-edit-outline"
                size={32}
                color={"deepskyblue"}
              />
              <Text style={styles.editText}>
                {editState ? "HIDE CONTROLS" : "EDIT"}
              </Text>
            </AnimatedPressable>
          )}
        </Animated.View>
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
    gap: 8,
  },
  timerContainer: {
    flexDirection: "row",
    minWidth: "80%",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 3000,
    borderWidth: 0.5,
    borderColor: hexcodeLuminosity("#60DD49", -50),
    backgroundColor: "#60DD49",
  },
  timerTime: {
    color: getContrastTextColour("#60DD49"),
    fontSize: 70,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
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
    overflow: "hidden",
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
