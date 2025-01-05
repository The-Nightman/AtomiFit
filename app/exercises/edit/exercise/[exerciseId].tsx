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
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { eventEmitter } from "@/utils/eventEmitter";
import Toast from "@/components/ux/Toast";
import { DistanceUnit, WeightUnit } from "@/types/units";
import { router, useLocalSearchParams } from "expo-router";
import { eq } from "drizzle-orm";
import ModalBase from "@/components/modals/ModalBase";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { convertWeightUnits } from "@/utils/convertWeightUnits";
import PickeriOSButton from "@/components/inputs/pickers/PickeriOSButton";
import BottomSheetPickeriOS from "@/components/inputs/pickers/BottomSheetPickeriOS";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * NewExercise component that renders a form to create a new exercise.
 *
 * It manages the form state, handles form submission, and displays toast notifications
 * based on the success or failure of the form submission.
 *
 * @returns {JSX.Element} The rendered NewExercise Screen.
 */
const editExercise = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<{
    name: string;
    notes: string;
    category: number;
    type: string;
    weight_unit: WeightUnit;
    currentSavedUnit: WeightUnit;
  }>({
    name: "",
    notes: "",
    category: 0,
    type: "Weight And Reps",
    weight_unit: null,
    currentSavedUnit: null,
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
  const [unitModal, setUnitModal] = useState<boolean>(false);
  const [unitConfirm, setUnitConfirm] = useState<{
    operation: "convert" | "switch" | null;
    queued: boolean;
  }>({ operation: null, queued: false });
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { db } = useContext(DrizzleContext);

  const { data } = useLiveQuery(db.select().from(schema.categories));

  useEffect(() => {
    const loadExercise = async () => {
      const exercise = await db
        .select()
        .from(schema.exercises)
        .where(eq(schema.exercises.id, Number(exerciseId)));

      setFormData({
        name: exercise[0].name,
        notes: exercise[0].notes,
        category: exercise[0].category_id,
        type: exercise[0].type,
        weight_unit: exercise[0].weight_unit,
        currentSavedUnit: exercise[0].weight_unit,
      });
    };

    loadExercise();
  }, [exerciseId]);

  // We use this because of the button being positioned in the header inside the layout
  useEffect(() => {
    eventEmitter.on("updateExercise", handleSaveExercise);
    return () => {
      eventEmitter.off("updateExercise", handleSaveExercise);
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

  /**
   * Handles the saving of an exercise. Validates the form data and updates the exercise in the database.
   * If the exercise name is empty or the category is invalid, it shows a toast message with an error.
   * If the weight unit has changed and there are previous sets, it shows a modal to confirm the change.
   * Otherwise, it updates the exercise in the database and shows a success toast message.
   * If an error occurs during the update, it shows an error toast message.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the exercise is saved or an error occurs.
   */
  const handleSaveExercise = async (): Promise<void> => {
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

    if (formData.currentSavedUnit !== formData.weight_unit) {
      const prevSets = await db
        .select()
        .from(schema.setsData)
        .where(eq(schema.setsData.exercise_id, Number(exerciseId)))
        .limit(1);

      if (prevSets.length > 0) {
        setUnitModal(true);
        return;
      }
    }

    try {
      await db
        .update(schema.exercises)
        .set({
          name: formData.name,
          notes: formData.notes,
          type: formData.type,
          category_id: formData.category,
          weight_unit: formData.weight_unit,
        })
        .where(eq(schema.exercises.id, Number(exerciseId)));
      setToastState({
        show: true,
        message: "Exercise Saved",
        colour: "#388E3C",
      });
    } catch (error) {
      setToastState({
        show: true,
        message: "An Error Occurred, Could Not Save Exercise",
        colour: "#C0392B",
      });
    }
  };

  /**
   * Handles the database change of unit for the exercises saved sets and continued update of the exercise.
   *
   * Depending on the operation specified in `unitConfirm`, it either converts the existing sets or switches the unit.
   *
   * - If the operation is "convert", it will convert the existing sets and update the database
   * with the new unit and other exercise details. This operation is not yet implemented.
   * - If the operation is "switch", it updates the database with the new unit and other exercise details.
   *
   * After a successful switch operation, it updates the form data and shows a success toast message.
   * If an error occurs during the switch operation, it shows an error toast message.
   *
   * Finally, it closes the unit modal and resets the unit confirmation state.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the unit change operation is complete.
   */
  const handleUnitChange = async (): Promise<void> => {
    if (unitConfirm.operation === "convert") {
      try {
        await db.transaction(async (tx) => {
          // We need to pull the saved sets and convert them in memory as there is no supported method for this in SQLite
          const savedSets = await tx
            .select()
            .from(schema.setsData)
            .where(eq(schema.setsData.exercise_id, Number(exerciseId)));

          const convertedSets = savedSets.map((set) => {
            return {
              ...set,
              weight: convertWeightUnits(
                set.weight!,
                formData.currentSavedUnit!,
                formData.weight_unit!
              ),
            };
          });

          // SQLite does not support batch updates so we need to loop through each set and update it one by one
          for (const set of convertedSets) {
            // We use a for loop for performance since it is a lower level operation with less overhead
            await tx
              .update(schema.setsData)
              .set({ weight: set.weight, weight_unit: formData.weight_unit })
              .where(eq(schema.setsData.id, set.id));
          }

          await tx
            .update(schema.exercises)
            .set({
              name: formData.name,
              notes: formData.notes,
              type: formData.type,
              category_id: formData.category,
              weight_unit: formData.weight_unit,
            })
            .where(eq(schema.exercises.id, Number(exerciseId)));
        });

        setFormData((prevState) => ({
          ...prevState,
          currentSavedUnit: formData.weight_unit,
        }));
        setToastState({
          show: true,
          message: "Exercise Saved",
          colour: "#388E3C",
        });
      } catch (error) {
        setToastState({
          show: true,
          message: "An Error Occurred, Could Not Change Units",
          colour: "#C0392B",
        });
      }
    }

    if (unitConfirm.operation === "switch") {
      try {
        await db.transaction(async (tx) => {
          await tx
            .update(schema.setsData)
            .set({ weight_unit: formData.weight_unit })
            .where(eq(schema.setsData.exercise_id, Number(exerciseId)));

          await tx
            .update(schema.exercises)
            .set({
              name: formData.name,
              notes: formData.notes,
              type: formData.type,
              category_id: formData.category,
              weight_unit: formData.weight_unit,
            })
            .where(eq(schema.exercises.id, Number(exerciseId)));
        });

        setFormData((prevState) => ({
          ...prevState,
          currentSavedUnit: formData.weight_unit,
        }));
        setToastState({
          show: true,
          message: "Exercise Saved",
          colour: "#388E3C",
        });
      } catch (error) {
        setToastState({
          show: true,
          message: "An Error Occurred, Could Not Change Units",
          colour: "#C0392B",
        });
      }
    }

    setUnitModal(false);
    setUnitConfirm({ operation: null, queued: false });
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
          style={{ zIndex: -1 }}
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
                    style={[
                      styles.categoryIndicator,
                      {
                        borderColor: hexcodeLuminosity(
                          (data.find(
                            (category) => category.id === formData.category
                          )?.colour as string) ?? "#000000",
                          40
                        ),
                        backgroundColor: data.find(
                          (category) => category.id === formData.category
                        )?.colour,
                      },
                    ]}
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
                <>
                  <View
                    style={[
                      styles.categoryIndicator,
                      {
                        borderColor: hexcodeLuminosity(
                          (data.find(
                            (category) => category.id === formData.category
                          )?.colour as string) ?? "#000000",
                          40
                        ),
                        backgroundColor: data.find(
                          (category) => category.id === formData.category
                        )?.colour,
                      },
                    ]}
                  />
                  <Picker
                    mode="dropdown"
                    style={styles.picker}
                    selectedValue={formData.category}
                    onValueChange={(itemValue: number) =>
                      setFormData({ ...formData, category: itemValue })
                    }
                  >
                    {[
                      // We use -1 for no cat. selected as 0 seems to not trigger onValueChange and thus no state update, mostly an android issue
                      { name: "None Selected", id: -1 },
                      ...data,
                    ].map((category) => (
                      <Picker.Item
                        key={category.id}
                        style={styles.pickerItemAndroid}
                        label={category.name}
                        value={category.id}
                      />
                    ))}
                  </Picker>
                </>
              )}
              <Pressable
                style={{ justifyContent: "center" }}
                onPress={() => router.navigate("/exercises/create/newCategory")}
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
      {/* Unit change modal */}
      <ModalBase
        modalState={unitModal}
        setModalState={() => setUnitModal(false)}
        onDismiss={() => setUnitConfirm({ operation: null, queued: false })}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalTitle}>CHANGE UNIT</Text>
          <View style={{ gap: 16 }}>
            <Text style={styles.modalText}>
              You already have sets recorded for{" "}
              <Text style={styles.modalTextAccent}>{formData.name}</Text> in{" "}
              <Text style={styles.modalTextAccent}>
                {formData.currentSavedUnit === "Kg" && "Kilograms (Kg)"}
              </Text>
              <Text style={styles.modalTextAccent}>
                {formData.currentSavedUnit === "Lbs" && "Pounds (Lbs)"}
              </Text>
              . Would you like to convert the existing sets to{" "}
              <Text style={styles.modalTextAccent}>
                {formData.weight_unit === "Kg" && "Kilograms (Kg)"}
              </Text>
              <Text style={styles.modalTextAccent}>
                {formData.weight_unit === "Lbs" && "Pounds (Lbs)"}
              </Text>{" "}
              or just change the unit itself?
            </Text>
            <View>
              <Pressable
                style={styles.modalOption}
                onPress={() =>
                  setUnitConfirm({ operation: "convert", queued: true })
                }
              >
                <View>
                  <Text style={styles.modalOptionName}>
                    Convert Existing Sets
                  </Text>
                  <Text style={styles.modalText}>
                    30 {formData.currentSavedUnit} will become 30{" "}
                    {formData.weight_unit}
                  </Text>
                </View>
                {unitConfirm.operation === "convert" ? (
                  <MaterialCommunityIcons
                    name="checkbox-outline"
                    size={24}
                    color={"#60DD49"}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={24}
                    color={hexcodeLuminosity("#9F9F9F", 30)}
                  />
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.modalOption,
                  {
                    borderBottomWidth: 1,
                  },
                ]}
                onPress={() =>
                  setUnitConfirm({ operation: "switch", queued: true })
                }
              >
                <View>
                  <Text style={styles.modalOptionName}>Only Change Unit</Text>
                  <Text style={styles.modalText}>
                    30 {formData.currentSavedUnit} will become 30{" "}
                    {formData.weight_unit}
                  </Text>
                </View>
                {unitConfirm.operation === "switch" ? (
                  <MaterialCommunityIcons
                    name="checkbox-outline"
                    size={24}
                    color={"#60DD49"}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={24}
                    color={hexcodeLuminosity("#9F9F9F", 30)}
                  />
                )}
              </Pressable>
            </View>
          </View>
          <View style={styles.modalButtonContainer}>
            <Pressable
              onPress={() => {
                setUnitModal(false);
                setUnitConfirm({ operation: null, queued: false });
              }}
              style={[styles.buttonBase, styles.cancelButton]}
            >
              <Text style={styles.buttonText}>CANCEL</Text>
            </Pressable>
            <Pressable
              disabled={!unitConfirm.operation}
              onPress={() => handleUnitChange()}
              style={[
                styles.buttonBase,
                styles.saveButton,
                { opacity: unitConfirm.operation ? 1 : 0.5 },
              ]}
            >
              <Text style={styles.buttonText}>SAVE</Text>
            </Pressable>
          </View>
        </View>
      </ModalBase>
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
    </>
  );
};

export default editExercise;

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
  },
  typePicker: {
    flex: 1,
  },
  categorySubcontainer: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
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
    color: "white",
    fontSize: 22,
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
  notesInput: {
    width: "95%",
    color: "white",
    fontSize: 17,
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
  modalBody: {
    width: "90%",
    minHeight: "30%",
    maxHeight: "90%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
    gap: 32,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  modalText: { color: "white", fontSize: 17 },
  modalTextAccent: { fontWeight: "600", color: "#60DD49" },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#9F9F9F",
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  modalOptionName: { color: "white", fontSize: 20, fontWeight: "500" },
  modalButtonContainer: { flexDirection: "row", gap: 16 },
  buttonBase: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#60DD49",
  },
  cancelButton: {
    backgroundColor: "#CD2C2C",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
  categoryIndicator: {
    width: 36,
    height: 36,
    alignSelf: "center",
    borderRadius: 18,
    borderWidth: 2,
  },
});
