import { MaterialTopTabs } from "@/components/layouts/materialTopTabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";

/**
 * AnalyticsLayout component.
 *
 * This component represents the layout for the analytics screens.
 *
 * @returns {JSX.Element} The rendered AnalyticsLayout component.
 */
const AnalyticsLayout = (): JSX.Element => {
  return (
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
  );
};

export default AnalyticsLayout;
