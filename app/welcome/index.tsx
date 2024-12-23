import { useContext, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg from "react-native-svg";
import AtomiFitFullLogoSVG from "@/components/Svg/AtomiFitFullLogoSVG";
import { Picker } from "@react-native-picker/picker";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { inArray, like } from "drizzle-orm";
import { useSettings } from "@/contexts/settingsContext";
import { AppSettingsValue } from "@/types/settings";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { router } from "expo-router";

/**
 * The `index` component that renders a welcome screen for the AtomiFit app.
 *
 * The `index` component is the first screen users are shown when opening the app to set their preferences.
 *
 * @remarks
 * Currently the default unit system and calendar week start (not yet implemented) are the only preferences shown here.
 * The component uses the `useSettings` custom hook to update app settings in the data store.
 *
 * @returns {JSX.Element} The rendered welcome screen component.
 */
const index = (): JSX.Element => {
  const [formData, setFormData] = useState({
    unitSystem: "metric",
    calendarWeekStart: 1,
  });

  const { updateSetting } = useSettings();

  // We need to get the screen width to calculate the svg dimensions
  const { width } = Dimensions.get("screen");
  const svgDimensions = {
    width: width * 0.9,
    // We set the width to 90% but we need to apply some arithmetic to preserve the aspect ratio
    // 5.8801953883118629110376470669346 is the sum of the viewBox width / height before dimensions were applied
    height: (width * 0.9) / 5.8801953883118629110376470669346,
  };
  const { db } = useContext(DrizzleContext);

  /**
   * Handles the setup process based on the selected unit system and updates the settings accordingly.
   *
   * - If the unit system is "metric", it updates the weight unit to "Kg" for exercises of type "Weight%".
   * - If the unit system is "imperial", it updates the weight unit to "Lbs" for exercises of type "Weight%".
   *
   * It then iterates over the formData entries and updates the settings data store for each key-value pair.
   * Finally, it navigates to the root ("/") route being the apps home page using a replace method
   * ensuring the user cannot navigate backwards.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the setup process is complete.
   */
  const handleSetup = async (): Promise<void> => {
    if (formData.unitSystem === "metric") {
      await db.transaction(async (tx) => {
        await tx
          .update(schema.exercises)
          .set({ weight_unit: "Kg" })
          .where(like(schema.exercises.type, "Weight%"));
        //! This is temporary just to convert existing data for testers who currently have a build
        await tx
          .update(schema.setsData)
          .set({ weight_unit: "Kg" })
          .where(
            inArray(
              schema.setsData.exercise_id,
              tx
                .select({ id: schema.exercises.id })
                .from(schema.exercises)
                .where(like(schema.exercises.type, "Weight%"))
            )
          );
        await tx
          .update(schema.setsData)
          .set({ distance_unit: "Km" })
          .where(
            inArray(
              schema.setsData.exercise_id,
              tx
                .select({ id: schema.exercises.id })
                .from(schema.exercises)
                .where(like(schema.exercises.type, "%Distance%"))
            )
          );
      });
    }
    if (formData.unitSystem === "imperial") {
      await db.transaction(async (tx) => {
        await tx
          .update(schema.exercises)
          .set({ weight_unit: "Lbs" })
          .where(like(schema.exercises.type, "Weight%"));
        //! This is temporary just to convert existing data for testers who currently have a build
        await tx
          .update(schema.setsData)
          .set({ weight_unit: "Lbs" })
          .where(
            inArray(
              schema.setsData.exercise_id,
              tx
                .select({ id: schema.exercises.id })
                .from(schema.exercises)
                .where(like(schema.exercises.type, "Weight%"))
            )
          );
        await tx
          .update(schema.setsData)
          .set({ distance_unit: "Mi" })
          .where(
            inArray(
              schema.setsData.exercise_id,
              tx
                .select({ id: schema.exercises.id })
                .from(schema.exercises)
                .where(like(schema.exercises.type, "%Distance%"))
            )
          );
      });
    }

    for (const [key, value] of Object.entries(formData)) {
      await updateSetting(
        key as keyof typeof formData,
        value as AppSettingsValue<"unitSystem" | "calendarWeekStart">
      );
    }

    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to</Text>
      {/* Originaly the SVG would be inline however this requirement has 
      changed but using an Svg element gives us some more flexibility */}
      <Svg
        style={{
          ...svgDimensions,
          marginBottom: 8,
        }}
      >
        <AtomiFitFullLogoSVG
          width={svgDimensions.width}
          height={svgDimensions.height}
          color={"#60DD49"}
        />
      </Svg>
      {/* We need to use a sacrificial view here to preserve layout and prevent fuckery with the SVG */}
      <View style={styles.seperator} />
      <View style={styles.subContainer}>
        <View style={{ gap: 16 }}>
          <Text style={styles.sectionsHeader}>Lets get you started...</Text>
          <View>
            <Text style={styles.sectionTitle}>Default Unit System</Text>
            <Picker
              mode="dropdown"
              style={[
                Platform.OS === "android" && { backgroundColor: "#3F3C3C" },
              ]}
              itemStyle={styles.pickerItemIos}
              selectedValue={formData.unitSystem}
              onValueChange={(value: string) =>
                setFormData({ ...formData, unitSystem: value })
              }
            >
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Metric"
                value="metric"
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Imperial"
                value="imperial"
              />
            </Picker>
          </View>
          <View>
            <Text style={styles.sectionTitle}>
              Calendar Week Start (not yet implemented)
            </Text>
            <Picker
              mode="dropdown"
              style={[
                Platform.OS === "android" && { backgroundColor: "#3F3C3C" },
              ]}
              itemStyle={styles.pickerItemIos}
              selectedValue={formData.calendarWeekStart}
              onValueChange={(value: number) =>
                setFormData({ ...formData, calendarWeekStart: value })
              }
            >
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Monday"
                value={1}
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Tuesday"
                value={2}
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Wednesday"
                value={3}
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Thursday"
                value={4}
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Friday"
                value={5}
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Saturday"
                value={6}
              />
              <Picker.Item
                style={styles.pickerItemAndroid}
                label="Sunday"
                value={0}
              />
            </Picker>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { backgroundColor: hexcodeLuminosity("#60DD49", -60) },
            ]}
            onPress={async () => {
              await handleSetup();
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    color: "white",
    fontSize: 34,
    fontWeight: "600",
  },
  seperator: {
    borderBottomColor: "#60DD49",
    borderBottomWidth: 4,
    marginBottom: 32,
  },
  subContainer: { flex: 1, justifyContent: "space-between" },
  sectionsHeader: { color: "white", fontSize: 24 },
  sectionTitle: { color: "white", fontSize: 17 },
  pickerItemIos: { color: "white" },
  pickerItemAndroid: { color: "white", backgroundColor: "#3F3C3C" },
  buttonContainer: {
    justifyContent: "center",
    marginBottom: 16,
    flexDirection: "row",
  },
  button: {
    flex: 0.5,
    width: "30%",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#60DD49",
  },
  buttonText: { color: "white", fontSize: 24 },
});
