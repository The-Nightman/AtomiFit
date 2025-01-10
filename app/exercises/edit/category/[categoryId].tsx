import { ColorValue, StyleSheet, Text, View } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eventEmitter } from "@/utils/eventEmitter";
import Toast from "@/components/ux/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrizzleError, eq } from "drizzle-orm";
import { colorKit } from "reanimated-color-picker";
import ColourPickerCircular from "@/components/inputs/pickers/ColourPickerCircular";
import { useLocalSearchParams } from "expo-router";
import { Category } from "@/types/categories";

/**
 * EditCategory component that renders a form to edit an existing category.
 *
 * It manages the form state, handles form submission, and displays toast notifications
 * based on the success or failure of the form submission.
 *
 * @remarks This screen is a result of moving away from the previous approach of modals due
 * to the requirement to stack modals and the limitations of iOS and its modal stacking ability.
 *
 * @returns {JSX.Element} The rendered EditCategory Screen.
 */
const editCategory = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<{
    name: string;
    colour: ColorValue;
  }>({
    name: "",
    colour: colorKit.randomRgbColor().hex(),
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
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { db } = useContext(DrizzleContext);

  // We use this because of the button being positioned in the header inside the layout
  useEffect(() => {
    eventEmitter.on("updateCategory", handleSaveCategory);
    return () => {
      eventEmitter.off("updateCategory", handleSaveCategory);
    };
  }, [formData]);

  useEffect(() => {
    const loadCategory = async () => {
      const [category]: Category[] = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, Number(categoryId)));

      setFormData({
        name: category.name,
        colour: category.colour,
      });
    };

    loadCategory();
  }, [categoryId]);

  /**
   * Handles the saving of a category.
   *
   * This function performs the following steps:
   * 1. Validates that the category name is not empty.
   * 2. Attempts to update the category in the database.
   * 3. Displays a success message if the category is saved successfully.
   * 4. Catches and handles errors, displaying appropriate error messages via toast.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the category is saved or an error is handled.
   */
  const handleSaveCategory = async (): Promise<void> => {
    if (formData.name === "") {
      setToastState({
        show: true,
        message: "Please Enter A Name",
        colour: "#C0392B",
      });
      return;
    }

    try {
      await db
        .update(schema.categories)
        .set({
          name: formData.name,
          colour: formData.colour as string,
        })
        .where(eq(schema.categories.id, Number(categoryId)));
      setToastState({
        show: true,
        message: "Category Saved",
        colour: "#388E3C",
      });
    } catch (error) {
      if (
        (error as DrizzleError).message.includes("UNIQUE constraint failed")
      ) {
        setToastState({
          show: true,
          colour: "#C0392B",
          message: "Category name must be unique",
        });
        return;
      }
      setToastState({
        show: true,
        message: "An Error Occurred, Could Not Save Category",
        colour: "#C0392B",
      });
    }
  };

  return (
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
        bounces={false}
        overScrollMode="auto"
        // This is so we can have the header render over the toast and the toast over
        // the rest of the content, rendering the toast outside of the screen container
        // positions it at the top of the device screen and z below the header
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
            placeholder="Category Name"
            placeholderTextColor={"#B9B9B9"}
            autoCapitalize="words"
            value={formData.name}
            onChangeText={(text: string) =>
              setFormData({ ...formData, name: text })
            }
          />
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>COLOUR</Text>
          <View style={{ width: "90%" }}>
            <ColourPickerCircular
              defaultColour={formData.colour}
              setColour={(colour) => setFormData({ ...formData, colour })}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default editCategory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollviewContainer: {
    padding: 16,
    gap: 32,
  },
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
});
