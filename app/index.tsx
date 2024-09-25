import { View, Text, StyleSheet, Pressable } from "react-native";
import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import UtilityStyles from "@/constants/UtilityStyles";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import DumbbellIconSVG from "@/components/Svg/DumbbellSVG";
import { Link } from "expo-router";

const index = () => {
  return (
    <View style={UtilityStyles.flex1}>
      {/* Header, contains interactive elements and is specific to this screen */}
      <View style={[styles.headerContainer]}>
        <View style={styles.headerIcon}>
          <AtomiFitShortSVG height={64} width={64} color={"#0F0F0F"} />
        </View>
        {/* Container for pressable elements */}
        <View style={styles.headerButtonsContainer}>
          {/* Calendar button */}
          <Link href="/calendar" asChild>
            <Pressable style={styles.headerCalendarButton}>
              {({ pressed }) => (
                <MaterialIcons
                  name="calendar-month"
                  size={32}
                  color={pressed ? "#2D6823" : "#60DD49"}
                />
              )}
            </Pressable>
          </Link>
          {/* Exercises button */}
          <Link href="/exercisesSearch" asChild>
          <Pressable
            style={styles.headerExercisesButton}
          >
            {({ pressed }) => (
              <DumbbellIconSVG
                width={48}
                height={42}
                color={pressed ? "#2D6823" : "#60DD49"}
              />
            )}
          </Pressable>
          </Link>
          {/* Settings/More button */}
          <Pressable
            onPress={() => console.log("settings")}
            style={styles.headerSettingsButton}
          >
            {({ pressed }) => (
              <Entypo
                name="dots-three-vertical"
                size={32}
                color={pressed ? "#2D6823" : "#60DD49"}
              />
            )}
          </Pressable>
        </View>
      </View>
      {/* Placeholder */}
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Workout Empty</Text>
        <Pressable
          onPress={() => console.log("start new workout")}
          style={styles.startNewWorkoutContainer}
        >
          {({ pressed }) => (
            <>
              <AntDesign
                name="plus"
                size={42}
                color={pressed ? "#2D6823" : "#60DD49"}
              />
              <Text
                style={[
                  styles.startNewWorkoutText,
                  pressed && { color: "#A0A0A0" },
                ]}
              >
                Start New Workout
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default index;

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
  headerCalendarButton: {
    height: 42,
    backgroundColor: "#292929",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerExercisesButton: {
    height: 42,
    backgroundColor: "#292929",
    paddingHorizontal: 2,
    borderRadius: 20,
  },
  headerSettingsButton: {
    height: 42,
    width: 42,
    backgroundColor: "#292929",
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
  },
  placeholderText: { marginVertical: "auto", color: "#B9B9B9", fontSize: 28 },
  startNewWorkoutContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "25%",
  },
  startNewWorkoutText: { color: "#B9B9B9", fontSize: 17 },
});
