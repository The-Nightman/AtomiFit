import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import UtilityStyles from "@/constants/UtilityStyles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import ExerciseMenu from "@/components/modals/ExerciseMenu";

/**
 * ExercisesLayout component.
 *
 * This renders the layout for browsing exercises in both the categories screen and [category] dynamic route.
 * It includes a header with a close/back button, a title, and an add button.
 * The layout uses Stack navigator to navigate between categories and exercises by [category].
 *
 * @returns {JSX.Element} The rendered component.
 */
const ExercisesSearchLayout = (): JSX.Element => {
  const insets = useSafeAreaInsets();

  /**
   * Renders the header component for the exercises search layout.
   *
   * The header includes:
   * - A close button that navigates back to the previous screen.
   * - A title text "Browse Exercises".
   * - An add button that navigates to the new exercise creation screen.
   *
   * @returns {JSX.Element} The header component.
   */
  const header = (): JSX.Element => {
    return (
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [
            { borderRadius: 22 },
            pressed && {
              backgroundColor: `${hexcodeLuminosity("#3F3C3C", 30)}66`,
            },
          ]}
          onPress={() => {
            router.back();
          }}
        >
          {({ pressed }) => (
            <MaterialIcons
              name="close"
              size={44}
              color={pressed ? hexcodeLuminosity("#3F3C3C", 10) : "#0F0F0F"}
            />
          )}
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: "500" }}>
          Browse Exercises
        </Text>
        <Pressable
          style={({ pressed }) => [
            { borderRadius: 22 },
            pressed && {
              backgroundColor: `${hexcodeLuminosity("#3F3C3C", 30)}66`,
            },
          ]}
          onPress={() => {
            router.push("/exercises/create/newExercise");
          }}
        >
          {({ pressed }) => (
            <MaterialIcons
              name="add"
              size={44}
              color={pressed ? hexcodeLuminosity("#3F3C3C", 10) : "#0F0F0F"}
            />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={UtilityStyles.flex1}>
      <Stack
        screenOptions={{
          header: () => header(),
          contentStyle: { backgroundColor: "#0F0F0F" },
        }}
      >
        <Stack.Screen name="categories" options={{ gestureEnabled: true }} />
        <Stack.Screen name="[category]" options={{ gestureEnabled: true }} />
      </Stack>
      {/* We can just declare this here, this will display on both screens as long as its
      declared here or in the categories screen but this will be better for maintainability */}
      <ExerciseMenu />
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
