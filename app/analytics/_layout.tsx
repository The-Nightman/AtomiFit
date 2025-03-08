import { MaterialTopTabs } from "@/components/layouts/materialTopTabs";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import { View, StyleSheet } from "react-native";
import UtilityStyles from "@/constants/UtilityStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";

/**
 * AnalyticsLayout component.
 *
 * This component represents the layout for the analytics screens.
 *
 * @returns {JSX.Element} The rendered CalendarLayout component.
 */
const AnalyticsLayout = (): JSX.Element => {
  return (
    <View style={UtilityStyles.flex1}>
      <View style={styles.headerContainer}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
      </View>
      <MaterialTopTabs
        screenOptions={{
          tabBarLabelStyle: { color: "white" },
          tabBarStyle: { backgroundColor: "#0F0F0F" },
          tabBarIndicatorStyle: { backgroundColor: "#60DD49" },
          sceneStyle: { backgroundColor: "#0F0F0F" },
        }}
      >
        <MaterialTopTabs.Screen
          name="records"
          options={{
            tabBarLabel: "Records",
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="trophy"
                size={20}
                color={focused ? "#60DD49" : hexcodeLuminosity("#3F3C3C", 40)}
              />
            ),
          }}
        />
      </MaterialTopTabs>
    </View>
  );
};

export default AnalyticsLayout;

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
  exerciseName: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8,
    marginHorizontal: 6,
  },
});
