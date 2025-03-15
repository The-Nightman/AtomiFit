import { View, Pressable, StyleSheet, Text, Platform } from "react-native";
import { Stack, usePathname } from "expo-router";
import { eventEmitter } from "@/utils/eventEmitter";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import { AntDesign } from "@expo/vector-icons";

/**
 * AnalyticsSharedLayout component.
 *
 * This component represents the layout for the analytics screens in the shared
 * (screens) route and associated modals for platform considerations.
 *
 * @returns {JSX.Element} The rendered AnalyticsSharedLayout component.
 */
const AnalyticsSharedLayout = (): JSX.Element => {
  const [, path] = usePathname().match(/^\/analytics\/(\w+)/)!;

  const header = (): JSX.Element => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
        <View style={styles.headerButtonsContainer}>
          {path === "records" && (
            <Pressable
              style={styles.headerFilterButton}
              onPress={() => {
                Platform.OS === "ios"
                  ? eventEmitter.emit("openiOSRecordsFilterModal")
                  : eventEmitter.emit("openRecordsFilterModal");
              }}
            >
              <AntDesign name="filter" size={24} color={"#60DD49"} />
              <Text
                style={[styles.headerFilterButtonText, { color: "#60DD49" }]}
              >
                FILTERS
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const modalHeader = (): JSX.Element => {
    return (
      <View style={styles.modalHeaderContainer}>
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
      <Stack.Screen name="(screens)" options={{ gestureEnabled: true }} />
      <Stack.Screen
        name="iOSRecordsFiltersModal"
        options={{
          gestureEnabled: true,
          presentation: "modal",
          header: () => modalHeader(),
        }}
      />
    </Stack>
  );
};

export default AnalyticsSharedLayout;

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    height: 120,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerIcon: { marginLeft: 6 },
  headerButtonsContainer: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    gap: 16,
    marginRight: 12,
  },
  headerFilterButton: {
    flexDirection: "row",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#292929",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerFilterButtonText: {
    fontSize: 17,
    fontWeight: "bold",
  },
  modalHeaderContainer: {
    display: "flex",
    height: 80,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
});
