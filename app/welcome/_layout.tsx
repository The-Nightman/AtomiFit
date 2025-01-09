import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";

/**
 * WelcomeLayout component.
 *
 * This component renders the layout for the welcome screen.
 *
 * @returns {JSX.Element} The rendered welcome layout component.
 */
const WelcomeLayout = (): JSX.Element => {
  const insets = useSafeAreaInsets();

  /**
   * Renders the header component.
   *
   * @returns {JSX.Element} The header component containing a view with a logo.
   */
  const header = (): JSX.Element => {
    return (
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
      </View>
    );
  };

  return (
    <Stack
      screenOptions={{
        header: () => header(),
        contentStyle: { backgroundColor: "#0F0F0F" },
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: true }} />
    </Stack>
  );
};

export default WelcomeLayout;

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    height: 120,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerIcon: {
    marginLeft: 6,
  },
});
