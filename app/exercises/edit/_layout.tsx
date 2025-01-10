import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { eventEmitter } from "@/utils/eventEmitter";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";

/**
 * ExerciseCategoryEditLayout component renders the layout for updating an exercise or category.
 * It includes a header with a close button, a title, and a check/confirm button.
 * The main content is displayed within a Stack navigator.
 *
 * @returns {JSX.Element} The rendered component.
 */
const ExerciseCategoryEditLayout = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  //! Either one of these will be undefined depending on the route, this shouldnt be an issue but we cant accurately type it
  const { exerciseId, categoryId } = useLocalSearchParams<{
    exerciseId: string;
    categoryId: string;
  }>();

  /**
   * Renders the header component for the update exercise/category screen.
   *
   * The header includes:
   * - A close button that navigates back to the previous screen.
   * - A title that dynamically displays "Edit Exercise" or "Edit Category" based on the `exerciseId` or `categoryId` prop.
   * - A check button that saved the exercise or category based on the `exerciseId` or `categoryId` prop.
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
          Edit {exerciseId && "Exercise"}
          {categoryId && "Category"}
        </Text>
        <Pressable
          style={({ pressed }) => [
            { borderRadius: 22 },
            pressed && {
              backgroundColor: `${hexcodeLuminosity("#3F3C3C", 30)}66`,
            },
          ]}
          onPress={() => {
            if (exerciseId) {
              eventEmitter.emit("updateExercise");
            }
            if (categoryId) {
              eventEmitter.emit("updateCategory");
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
      <Stack.Screen
        name="exercise/[exerciseId]"
        options={{ gestureEnabled: true }}
        initialParams={{ exerciseId }}
      />
      <Stack.Screen
        name="category/[categoryId]"
        options={{ gestureEnabled: true }}
        initialParams={{ categoryId }}
      />
    </Stack>
  );
};

export default ExerciseCategoryEditLayout;

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
