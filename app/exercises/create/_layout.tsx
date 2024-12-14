import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import UtilityStyles from "@/constants/UtilityStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { eventEmitter } from "@/utils/eventEmitter";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";

/**
 * ExerciseCreateLayout component renders the layout for creating a new exercise.
 * It includes a header with a close button, a title, and a check/confirm button.
 * The main content is displayed within a Stack navigator.
 *
 * @returns {JSX.Element} The rendered component.
 */
const ExerciseCreateLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={UtilityStyles.flex1}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => {
            router.back();
          }}
        >
          {({ pressed }) => (
            <MaterialIcons
              name="close"
              size={44}
              color={pressed ? hexcodeLuminosity("#3F3C3C", 30) : "#292929"}
            />
          )}
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: "500" }}>
          Add New Exercise
        </Text>
        <Pressable onPress={() => eventEmitter.emit("createExercise")}>
          {({ pressed }) => (
            <MaterialIcons
              name="check"
              size={44}
              color={pressed ? hexcodeLuminosity("#3F3C3C", 30) : "#292929"}
            />
          )}
        </Pressable>
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F0F" },
        }}
      >
        <Stack.Screen name="newExercise" options={{ gestureEnabled: true }} />
      </Stack>
    </View>
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
