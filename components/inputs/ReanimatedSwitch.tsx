import {
  ColorValue,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ReanimatedSwitchProps {
  value: SharedValue<boolean>;
  onPress: () => void;
  trackStyle?: StyleProp<ViewStyle>;
  duration?: number;
  trackColors?: {
    on: ColorValue;
    off: ColorValue;
  };
}

/**
 * A customizable animated switch component built with Reanimated.
 *
 * @remarks Sourced from reanimated docs examples: https://docs.swmansion.com/react-native-reanimated/examples/switch
 *
 * @component
 * @param {ReanimatedSwitchProps} props - The properties for the Switch component.
 * @param {SharedValue<boolean>} props.value - A Reanimated shared value that determines the switch's state (false = off, true = on).
 * @param {() => void} props.onPress - A callback function triggered when the switch is pressed.
 * @param {StyleProp<ViewStyle>} [props.trackStyle] - (Optional) Custom styles for the switch track.
 * @param {number} [props.duration=400] - (Optional) The duration (in milliseconds) of the animation when the switch state changes.
 * @param {{ on: ColorValue; off: ColorValue }} [props.trackColors={ on: "#82CAB2", off: "#FA7F7C" }] - (Optional) The colors for the track in the "on" and "off" states.
 *
 * @returns {JSX.Element} The rendered Switch component.
 *
 * @example
 * ```tsx
 * const value = useSharedValue(false);
 *
 * const toggleSwitch = () => {
 *   value.value = !value.value;
 * };
 *
 * <Switch
 *   value={value}
 *   onPress={toggleSwitch}
 *   style={{ width: 60, height: 30 }}
 *   duration={300}
 *   trackColors={{ on: "#4caf50", off: "#f44336" }}
 * />
 * ```
 */
const ReanimatedSwitch = ({
  value,
  onPress,
  trackStyle,
  duration = 400,
  trackColors = { on: "#82CAB2", off: "#FA7F7C" },
}: ReanimatedSwitchProps): JSX.Element => {
  const height = useSharedValue(0);
  const width = useSharedValue(0);

  /**
   * The animated style for the track. Interpolates the background colour of the track
   * based on the value of the `value` prop, the timing of the animation is controlled by
   * the `duration` prop. The border radius of the element is also created here based on
   * the height of the component on layout.
   */
  const trackAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      // This is by far the fastest method, using Number(value.value) does display intent well
      // and that shouldn't affect performance but i want to try and squeeze as much as I can
      value.value ? 1 : 0,
      [0, 1],
      [trackColors.off as string, trackColors.on as string]
    );
    const colorValue = withTiming(color, { duration });

    return {
      backgroundColor: colorValue,
      borderRadius: height.value / 2,
    };
  });

  /**
   * The animated style for the thumb. Interpolates the position of the thumb based on the value of the
   * `value` prop and constrained by the range limit set by the result of the `width` and `height` values
   * that are set on layout, the timing of the animation is controlled by the `duration` prop. The border
   * radius of the element is also created here based on the height of the component on layout.
   */
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const moveValue = interpolate(
      value.value ? 1 : 0,
      [0, 1],
      [0, width.value - height.value]
    );
    const translateValue = withTiming(moveValue, { duration });

    return {
      transform: [{ translateX: translateValue }],
      borderRadius: height.value / 2,
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
          width.value = e.nativeEvent.layout.width;
        }}
        style={[styles.track, trackStyle, trackAnimatedStyle]}
      >
        <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
      </Animated.View>
    </Pressable>
  );
};

export default ReanimatedSwitch;

const styles = StyleSheet.create({
  track: {
    alignItems: "flex-start",
    width: 100,
    height: 40,
    padding: 5,
  },
  thumb: {
    height: "100%",
    aspectRatio: 1,
    backgroundColor: "white",
  },
});
