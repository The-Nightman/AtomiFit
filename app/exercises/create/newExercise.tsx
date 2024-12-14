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

/**
 * NewExercise component that renders a form to create a new exercise.
 *
 * It manages the form state, handles form submission, and displays toast notifications
 * based on the success or failure of the form submission.
 *
 * @returns {JSX.Element} The rendered NewExercise Screen.
 */
const newExercise = (): JSX.Element => {
  const [formData, setFormData] = useState<{
    name: string;
    notes: string;
    category: number;
    type: string;
    // unit: string; not yet implemented
  }>({
    name: "",
    notes: "",
    category: 0,
    type: "Weight And Reps",
    // unit: "", not yet implemented
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
      });
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
        <ScrollView contentContainerStyle={styles.scrollviewContainer}>
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
                gap: 16,
              }}
            >
              <Picker
                mode="dropdown"
                style={[
                  styles.picker,
                  Platform.OS === "android" && { backgroundColor: "#3F3C3C" },
                ]}
                itemStyle={styles.pickerItemIos}
                selectedValue={formData.category}
                onValueChange={(itemValue: number) =>
                  setFormData({ ...formData, category: itemValue })
                }
              >
                <Picker.Item
                  style={styles.pickerItemAndroid}
                  label="None Selected"
                  value={0}
                />
                {data.map((category) => (
                  <Picker.Item
                    key={category.id}
                    style={styles.pickerItemAndroid}
                    label={category.name}
                    value={category.id}
                  />
                ))}
              </Picker>
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
            <Picker
              mode="dropdown"
              style={[
                styles.picker,
                Platform.OS === "android" && { backgroundColor: "#3F3C3C" },
              ]}
              itemStyle={styles.pickerItemIos}
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
          </View>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>UNIT</Text>
            <Text style={{ color: "white" }}>not yet implemented</Text>
          </View>
        </ScrollView>
      </View>
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
});
