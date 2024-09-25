import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import UtilityStyles from "@/constants/UtilityStyles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * ExercisesSearchLayout component.
 * 
 * This renders the layout for browsing exercises in both the categories screen and [category] dynamic route.
 * It includes a header with a close/back button, a title, and an add button.
 * The layout uses Stack navigator to navigate between categories and exercises by [category].
 *
 * @returns {JSX.Element} The rendered component.
 */
const ExercisesSearchLayout = (): JSX.Element => {
  const insets = useSafeAreaInsets();

  return (
    <View style={UtilityStyles.flex1}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Link href="../" asChild>
          <MaterialIcons name="close" size={44} color="#292929" />
        </Link>
        <Text style={{ fontSize: 28, fontWeight: "500" }}>
          Browse Exercises
        </Text>
        <Pressable>
          <MaterialIcons name="add" size={44} color="#292929" />
        </Pressable>
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F0F" },
        }}
      >
        <Stack.Screen name="categories" options={{ gestureEnabled: true }} />
        <Stack.Screen name="[category]" options={{ gestureEnabled: true }} />
      </Stack>
    </View>
  );
};

export default ExercisesSearchLayout;

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    height: 100,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
