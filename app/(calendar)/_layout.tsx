import { Link, Stack, usePathname } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import UtilityStyles from "@/constants/UtilityStyles";
import { Entypo, MaterialIcons } from "@expo/vector-icons";

const { width: SIDEBAR_WIDTH } = Dimensions.get("window");

/**
 * CalendarLayout component.
 *
 * This component represents the layout for the calendar view and list view.
 * It includes a sidebar menu that can be panned open or closed.
 * The layout also includes a stack of screens for navigation.
 *
 * @returns {JSX.Element} The rendered CalendarLayout component.
 */
const CalendarLayout = (): JSX.Element => {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const [svgDimensions, setSvgDimensions] = useState<number>(0);
  const translateX = useSharedValue<number>(-SIDEBAR_WIDTH);

  /**
   * Handles the layout change event to set the SVG size in the sidebar.
   *
   * @param {LayoutChangeEvent} event - The layout change event.
   */
  const handleLayout = (event: LayoutChangeEvent) => {
    // Get the width of the specified view
    const { width } = event.nativeEvent.layout;
    setSvgDimensions(width * 0.33);
  };

  /**
   * Gesture configuration for panning.
   */
  const panGesture: PanGesture = Gesture.Pan()
    .activeOffsetX([-30, 30]) // Active offset for required distance to pan before activating
    .onUpdate(({ translationX }) => {
      // Update the shared value for translationX within bounds
      translateX.value = Math.max(
        -SIDEBAR_WIDTH,
        Math.min(0, translateX.value + translationX * 0.1)
      );
    })
    .onEnd(() => {
      if (translateX.value > -SIDEBAR_WIDTH / 3) {
        // if closer to the open position finish the animation
        translateX.value = withSpring(0, { velocity: 0.1, damping: 20 });
      } else {
        // if closer to the closed position finish the animation
        translateX.value = withSpring(-SIDEBAR_WIDTH, {
          velocity: 0.1,
          damping: 20,
        });
      }
    });

  /**
   * Animated style for the sidebar, sets the translation value to the pan value to animate movement.
   */
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={panGesture}>
        <View style={UtilityStyles.flex1}>
          <View style={styles.headerContainer}>
            <View>
              <Pressable
                style={styles.headerMenuButton}
                onPress={() =>
                  (translateX.value = withSpring(0, {
                    velocity: 0.1,
                    damping: 20,
                  }))
                }
              >
                <Entypo name="menu" size={45} color="black" />
                <AtomiFitShortSVG color={"#0F0F0F"} />
              </Pressable>
            </View>
          </View>
          {/* Sidebar Menu */}
          <Animated.View style={[styles.sideMenuContainer, animatedStyle]}>
            <View
              style={[styles.sideMenuBar, { paddingTop: insets.top }]}
              onLayout={handleLayout}
            >
              <AtomiFitShortSVG
                color={"#60DD49"}
                height={svgDimensions}
                width={svgDimensions}
              />
              <View>
                <Link href="/" asChild replace>
                  <Pressable style={styles.sideButton}>
                    <MaterialIcons
                      name="calendar-month"
                      size={28}
                      color={path === "/" ? "#60DD49" : "white"}
                    />
                    <Text
                      style={
                        path === "/"
                          ? styles.sideButtonTextActive
                          : styles.sideButtonText
                      }
                    >
                      Calendar View
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/listView" asChild replace>
                  <Pressable style={styles.sideButton}>
                    <MaterialIcons
                      name="format-list-bulleted"
                      size={28}
                      color={path === "/listView" ? "#60DD49" : "white"}
                    />
                    <Text
                      style={
                        path === "/listView"
                          ? styles.sideButtonTextActive
                          : styles.sideButtonText
                      }
                    >
                      List View
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
            <Pressable
              style={styles.sideMenuClosePressable}
              onPress={() =>
                (translateX.value = withSpring(-SIDEBAR_WIDTH, {
                  velocity: 0.1,
                  damping: 20,
                }))
              }
            />
          </Animated.View>
          {/* Stack */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0F0F0F" },
            }}
          >
            <Stack.Screen
              name="index"
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen name="listView" options={{ gestureEnabled: true }} />
          </Stack>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    height: 120,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerMenuButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  sideMenuContainer: {
    display: "flex",
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  sideMenuBar: {
    width: "80%",
    height: "100%",
    backgroundColor: "#292929",
    padding: 20,
  },
  sideMenuClosePressable: { width: "20%", height: "100%" },
  sideButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#555555",
    padding: 10,
  },
  sideButtonText: { fontSize: 28, color: "white" },
  sideButtonTextActive: { fontSize: 28, fontWeight: "bold", color: "#60DD49" },
});

export default CalendarLayout;
