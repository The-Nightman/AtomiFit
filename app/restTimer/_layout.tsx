import { Pressable, StyleSheet, View } from "react-native";
import { router, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

/**
 * A layout component for the Rest Timer screen.
 *
 * This component wraps its children with a `BlurView` to provide a blurred background effect.
 * It uses the `dimezisBlurView` experimental blur method to enable blur on android devices.
 * The `Stack` navigator is used to define the screen structure, with custom header and modal presentation options.
 *
 * @returns {JSX.Element} The rendered layout component
 */
const RestTimerLayout = (): JSX.Element => {
  return (
    <BlurView
      experimentalBlurMethod="dimezisBlurView"
      blurReductionFactor={4}
      intensity={100}
      tint="systemChromeMaterialDark"
      style={styles.blurView}
    >
      <Stack screenOptions={{ header: () => restTimerHeader() }}>
        <Stack.Screen
          name="index"
          options={{
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </Stack>
    </BlurView>
  );
};

export default RestTimerLayout;

/**
 * A custom header for the rest timer screen.
 *
 * This header consists of a close button styled with padding that adapts to the
 * safe area insets of the device. Pressing the button navigates back to the
 * previous screen.
 *
 * @returns {JSX.Element} The custom rest timer header.
 */
const restTimerHeader = (): JSX.Element => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ padding: 4, paddingTop: insets.top }}>
      <Pressable
        onPress={() => {
          router.back();
        }}
        style={styles.headerButton}
      >
        {({ pressed }) => (
          <MaterialIcons
            name="close"
            size={50}
            color={pressed ? hexcodeLuminosity("#60DD49", -60) : "#60DD49"}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  blurView: { flex: 1 },
  headerButton: {
    width: 50,
    height: 50,
  },
});
