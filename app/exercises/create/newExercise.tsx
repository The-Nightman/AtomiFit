import {
  ColorValue,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { MaterialIcons } from "@expo/vector-icons";
import { eventEmitter } from "@/utils/eventEmitter";
import Toast from "@/components/ux/Toast";
import NewCategoryModal from "@/components/modals/NewCategoryModal";
import { DistanceUnit, WeightUnit } from "@/types/units";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheetPickeriOS from "@/components/inputs/pickers/BottomSheetPickeriOS";
import PickeriOSButton from "@/components/inputs/pickers/PickeriOSButton";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { DrizzleError } from "drizzle-orm";

/**
 * NewExercise component that renders a form to create a new exercise.
 *
 * It manages the form state, handles form submission, and displays toast notifications
 * based on the success or failure of the form submission.
 *
 * @returns {JSX.Element} The rendered NewExercise Screen.
 */
const newExercise = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<{
    name: string;
    notes: string;
    category: number;
    type: string;
    weight_unit: WeightUnit;
  }>({
    name: "",
    notes: "",
    category: 0,
    type: "Weight And Reps",
    weight_unit: null,
  });
  const [toastState, setToastState] = useState<{
    show: boolean;
    colour: ColorValue;
    message: string;
  }>({
    show: false,
    colour: "",
    message: "",
  });
  const [categoryModal, setCategoryModal] = useState<boolean>(false);
  const { db } = useContext(DrizzleContext);

  const { data } = useLiveQuery(db.select().from(schema.categories));

  // We use this because of the button being positioned in the header inside the layout
  useEffect(() => {
    eventEmitter.on("createExercise", handleSaveExercise);
    return () => {
      eventEmitter.off("createExercise", handleSaveExercise);
    };
  }, [formData]); // handleSaveExercise is dependent on formData, if we leave this blank we are passing initial state

  // Whenever we change types we want to automatically set and reset the units
  // to guarantee the user does not submit an exercise with incorrect units
  useEffect(() => {
    // Batching state could be redundant but it makes sure the changes properly take effect, originally weight_unit was
    // going to be implemented but has since been evaluated as unnecessary fluff for exercises so they are limited to sets
    if (!/weight/i.test(formData.type) && formData.weight_unit) {
      setFormData((prevState) => ({ ...prevState, weight_unit: null }));
    }
    if (/weight/i.test(formData.type) && !formData.weight_unit) {
      setFormData((prevState) => ({ ...prevState, weight_unit: "Kg" }));
    }
  }, [formData.type]);

  const types = [
    "Weight And Reps",
    "Distance And Time",
    "Weight And Distance",
    "Weight And Time",
    "Reps And Distance",
    "Reps And Time",
    "Weight",
    "Reps",
    "Distance",
    "Time",
  ];

  const units: {
    weight: { label: string; value: WeightUnit }[];
    distance: { label: string; value: DistanceUnit }[];
  } = {
    weight: [
      { label: "Metric (Kilogram) - Kg", value: "Kg" },
      { label: "Imperial (Pounds) - Lbs", value: "Lbs" },
    ],
    distance: [
      { label: "Kilometres - Km", value: "Km" },
      { label: "Miles - Mi", value: "Mi" },
      { label: "Metres - M", value: "M" },
      { label: "Feet - Ft", value: "Ft" },
    ],
  };

  const handleSaveExercise = async () => {
    if (formData.name === "") {
      setToastState({
        show: true,
        message: "Please Enter A Name",
        colour: "#C0392B",
      });
      return;
    }
    if (typeof formData.category !== "number" || formData.category < 1) {
      setToastState({
        show: true,
        message: "Please Select A Category",
        colour: "#C0392B",
      });
      return;
    }

    try {
      await db.insert(schema.exercises).values({
        name: formData.name,
        notes: formData.notes,
        type: formData.type,
        category_id: formData.category,
        weight_unit: formData.weight_unit,
      });
      setToastState({
        show: true,
        message: "Exercise Saved",
        colour: "#388E3C",
      });
      setFormData({
        name: "",
        notes: "",
        category: 0,
        type: "Weight And Reps",
        weight_unit: null,
      });
    } catch (error) {
      if (
        (error as DrizzleError).message.includes("UNIQUE constraint failed")
      ) {
        setToastState({
          show: true,
          colour: "#C0392B",
          message: "Exercise name must be unique",
        });
        return;
      }
      setToastState({
        show: true,
        message: "An Error Occurred, Could Not Save Exercise",
        colour: "#C0392B",
      });
    }
  };

  return (
    <>
      <View style={styles.container}>
        {toastState.show && (
          <Toast
            message={toastState.message}
            colour={toastState.colour}
            autoDismiss={() =>
              setToastState({ show: false, message: "", colour: "" })
            }
          />
        )}
        <ScrollView
          contentContainerStyle={[
            styles.scrollviewContainer,
            { paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>NAME</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Exercise Name"
              placeholderTextColor={"#B9B9B9"}
              autoCapitalize="words"
              value={formData.name}
              onChangeText={(text: string) =>
                setFormData({ ...formData, name: text })
              }
            />
          </View>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              placeholderTextColor={"#B9B9B9"}
              value={formData.notes}
              onChangeText={(text: string) =>
                setFormData({ ...formData, notes: text })
              }
              multiline
            />
          </View>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>CATEGORY</Text>
            <View
              style={{
                width: "95%",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {Platform.OS === "ios" ? (
                <>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      alignSelf: "center",
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: hexcodeLuminosity(
                        (data.find(
                          (category) => category.id === formData.category
                        )?.colour as string) ?? "#000000",
                        40
                      ),
                      backgroundColor: data.find(
                        (category) => category.id === formData.category
                      )?.colour,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <PickeriOSButton
                      text={
                        data.find(
                          (category) => category.id === formData.category
                        )?.name || "None Selected"
                      }
                      onPress={() => eventEmitter.emit("openCategoryPicker")}
                    />
                  </View>
                </>
              ) : (
                <Picker
                  mode="dropdown"
                  style={styles.picker}
                  selectedValue={formData.category}
                  onValueChange={(itemValue: number) =>
                    setFormData({ ...formData, category: itemValue })
                  }
                >
                  {[{ name: "None Selected", id: 0 }, ...data].map(
                    (category) => (
                      <Picker.Item
                        key={category.id}
                        style={styles.pickerItemAndroid}
                        label={category.name}
                        value={category.id}
                      />
                    )
                  )}
                </Picker>
              )}
              <Pressable
                style={{ justifyContent: "center" }}
                onPress={() => setCategoryModal(true)}
              >
                {({ pressed }) => (
                  <MaterialIcons
                    name="add"
                    size={48}
                    color={pressed ? "#60DD49" : "white"}
                  />
                )}
              </Pressable>
            </View>
          </View>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>TYPE</Text>
            {Platform.OS === "ios" ? (
              <View
                style={{
                  width: "95%",
                }}
              >
                <PickeriOSButton
                  text={
                    types.find((type) => type === formData.type) ??
                    "Select Type"
                  }
                  onPress={() => eventEmitter.emit("openTypePicker")}
                />
              </View>
            ) : (
              <Picker
                mode="dropdown"
                style={styles.picker}
                selectedValue={formData.type}
                onValueChange={(itemValue: string) =>
                  setFormData({ ...formData, type: itemValue })
                }
              >
                {types.map((type, i) => (
                  <Picker.Item
                    key={`${type}-${i}`}
                    style={styles.pickerItemAndroid}
                    label={type}
                    value={type}
                  />
                ))}
              </Picker>
            )}
          </View>
          {/weight/i.test(formData.type) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>WEIGHT UNIT</Text>
              {Platform.OS === "ios" ? (
                <View
                  style={{
                    width: "95%",
                  }}
                >
                  <PickeriOSButton
                    text={
                      units.weight.find(
                        (unit) => unit.value === formData.weight_unit
                      )?.label || "Select Weight Unit"
                    }
                    onPress={() => eventEmitter.emit("openWeightUnitPicker")}
                  />
                </View>
              ) : (
                <Picker
                  mode="dropdown"
                  style={styles.picker}
                  itemStyle={styles.pickerItemIos}
                  selectedValue={formData.weight_unit}
                  onValueChange={(itemValue: WeightUnit) =>
                    setFormData({ ...formData, weight_unit: itemValue })
                  }
                >
                  {units.weight.map((unit) => (
                    <Picker.Item
                      key={unit.value}
                      style={styles.pickerItemAndroid}
                      label={unit.label}
                      value={unit.value}
                    />
                  ))}
                </Picker>
              )}
            </View>
          )}
        </ScrollView>
      </View>
      {Platform.OS === "ios" && (
        // We may need to refactor how we do this depending on how it functions with accessibility later on
        <>
          <BottomSheetPickeriOS
            eventName="openCategoryPicker"
            data={[{ name: "None Selected", id: 0 }, ...data].map(
              (category) => ({
                label: category.name,
                value: category.id,
              })
            )}
            value={formData.category}
            onChange={(value) =>
              setFormData({ ...formData, category: Number(value) })
            }
            closeEvents={["openTypePicker", "openWeightUnitPicker"]}
          />
          <BottomSheetPickeriOS
            eventName="openTypePicker"
            data={types.map((type) => ({ label: type, value: type }))}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value })}
            closeEvents={["openCategoryPicker", "openWeightUnitPicker"]}
          />
          <BottomSheetPickeriOS
            eventName="openWeightUnitPicker"
            data={units.weight}
            value={formData.weight_unit}
            onChange={(value) =>
              setFormData({ ...formData, weight_unit: value })
            }
            closeEvents={["openCategoryPicker", "openTypePicker"]}
          />
        </>
      )}
      <NewCategoryModal
        modalState={categoryModal}
        setModalState={setCategoryModal}
        returnCategoryId={(id: number) =>
          setFormData({ ...formData, category: id })
        }
      />
    </>
  );
};

export default newExercise;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollviewContainer: {
    padding: 16,
    gap: 32,
  },
  picker: {
    flex: 1,
    width: "95%",
    backgroundColor: "#3F3C3C",
  },
  typePicker: {
    flex: 1,
  },
  pickerItemIos: { color: "white" },
  pickerItemAndroid: { color: "white", backgroundColor: "#3F3C3C" },
  sectionContainer: { alignItems: "center" },
  sectionTitle: {
    width: "100%",
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    borderBottomWidth: 4,
    borderBottomColor: "#60DD49",
    marginBottom: 8,
  },
  nameInput: {
    width: "95%",
    minHeight: 44,
    color: "white",
    fontSize: 22,
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
  notesInput: {
    width: "95%",
    minHeight: 44,
    color: "white",
    fontSize: 17,
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
});
