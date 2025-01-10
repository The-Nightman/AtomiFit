import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { eventEmitter } from "@/utils/eventEmitter";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { usePathname } from "expo-router/build/hooks";

/**
 * ExerciseCreateLayout component renders the layout for creating a new exercise or category.
 * It includes a header with a close button, a title, and a check/confirm button.
 * The main content is displayed within a Stack navigator.
 *
 * @returns {JSX.Element} The rendered component.
 */
const ExerciseCreateLayout = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const screen = usePathname().match(/^\/exercises\/create\/(.*)$/)![1]; // this comes from the router so it will always be present

  /**
   * Renders the header component for the create exercise/category screen.
   *
   * The header includes:
   * - A close button that navigates back to the previous screen.
   * - A title that dynamically displays "Add New Exercise" or "Add New Category" based on the `screen` prop.
   * - A check button that triggers the creation of a new exercise or category based on the `screen` prop.
   *
   * @returns {JSX.Element} The header component.
   */
  const header = (): JSX.Element => {
    return (
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top, zIndex: 1000 },
        ]}
      >
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
          Add New {screen === "newExercise" ? "Exercise" : "Category"}
        </Text>
        <Pressable
          style={({ pressed }) => [
            { borderRadius: 22 },
            pressed && {
              backgroundColor: `${hexcodeLuminosity("#3F3C3C", 30)}66`,
            },
          ]}
          onPress={() => {
            if (screen) {
              if (screen === "newCategory") {
                eventEmitter.emit("createCategory");
              } else {
                eventEmitter.emit("createExercise");
              }
            }
          }}
        >
          {({ pressed }) => (
            <MaterialIcons
              name="check"
              size={44}
              color={pressed ? hexcodeLuminosity("#3F3C3C", 10) : "#0F0F0F"}
            />
          )}
        </Pressable>
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
      <Stack.Screen name="newExercise" options={{ gestureEnabled: true }} />
      <Stack.Screen name="newCategory" options={{ gestureEnabled: true }} />
    </Stack>
  );
};

export default ExerciseCreateLayout;

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
