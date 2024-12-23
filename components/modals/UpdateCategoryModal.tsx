import {
  ColorValue,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ModalBase from "./ModalBase";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useContext, useEffect, useState } from "react";
import ColourPickerModal from "./ColourPickerModal";
import Toast from "../ux/Toast";
import * as schema from "@/database/schema";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { eq } from "drizzle-orm";
import { eventEmitter } from "@/utils/eventEmitter";

/**
 * UpdateCategoryModal component.
 *
 * This component renders a modal for updating a category. It includes a form
 * with inputs for the category name and colour, and handles saving the updated category
 * details to the database. The component also displays toast messages for success or error
 * notifications.
 *
 * @component
 * @returns {JSX.Element} The rendered UpdateCategoryModal component.
 *
 * @example
 * ```tsx
 * <UpdateCategoryModal />
 * ```
 */
const UpdateCategoryModal = (): JSX.Element => {
  const [formData, setFormData] = useState<{
    id: number | null;
    name: string;
    colour: ColorValue;
  }>({
    id: null,
    name: "",
    colour: "",
  });
  const [modalState, setModalState] = useState<boolean>(false);
  const [colourPickerModal, setColourPickerModal] = useState(false);
  const [toastState, setToastState] = useState<{
    show: boolean;
    colour: ColorValue;
    message: string;
  }>({
    show: false,
    colour: "",
    message: "",
  });
  const { db } = useContext(DrizzleContext);

  useEffect(() => {
    eventEmitter.on("editCategory", (categoryId: number) => {
      fetchCategory(categoryId);
    });
    return () => {
      eventEmitter.off("editCategory", (categoryId: number) => {
        fetchCategory(categoryId);
      });
    };
  }, []);

  /**
   * Fetches a category by its ID and updates the form data state with the category's details.
   * Also sets the modal state to true.
   *
   * @param {number} categoryId - The ID of the category to fetch.
   * @returns {Promise<void>} A promise that resolves when the category has been fetched and the state has been updated.
   */
  const fetchCategory = async (categoryId: number): Promise<void> => {
    const category = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, categoryId));
    setFormData({
      id: category[0].id,
      name: category[0].name,
      colour: category[0].colour,
    });
    setModalState(true);
  };

  /**
   * Handles the saving of the category details.
   *
   * This function validates the form data and saves the category to the database.
   * The function also controls toast state to display success or error messages.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the category is saved or an error occurs.
   */
  const handleSaveCategory = async (): Promise<void> => {
    if (formData.name === "") {
      setToastState({
        show: true,
        colour: "#C0392B",
        message: "Category name cannot be empty.",
      });
      return;
    }

    try {
      await db
        .update(schema.categories)
        .set({ name: formData.name, colour: formData.colour as string })
        .where(eq(schema.categories.id, formData.id!));

      setToastState({
        show: true,
        colour: "#388E3C",
        message: "Category saved successfully",
      });
      setFormData({ id: null, name: "", colour: "" });
      setModalState(false);
    } catch (error) {
      setToastState({
        show: true,
        colour: "#C0392B",
        message: "An error occurred while saving the category.",
      });
    }
  };

  return (
    <>
      {toastState.show && (
        <Toast
          message={toastState.message}
          colour={toastState.colour}
          autoDismiss={() =>
            setToastState({ show: false, message: "", colour: "" })
          }
        />
      )}
      <ModalBase
        modalState={modalState}
        setModalState={() => setModalState(false)}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalTitle}>UPDATE CATEGORY</Text>
          <View style={styles.categoryInputContainer}>
            <Pressable
              style={{
                backgroundColor: formData.colour,
                width: 40,
                height: 40,
                borderRadius: 20,
                borderColor: hexcodeLuminosity(formData.colour as string, 40),
                borderWidth: 1,
              }}
              onPress={() => setColourPickerModal(true)}
            />
            <TextInput
              autoCapitalize="words"
              style={styles.inputText}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.nativeEvent.text })
              }
            />
          </View>
          <View style={styles.modalButtonContainer}>
            <Pressable
              onPress={() => {
                setFormData({ id: null, name: "", colour: "#60DD49" });
                setModalState(false);
              }}
              style={[styles.buttonBase, styles.cancelButton]}
            >
              <Text style={styles.buttonText}>CANCEL</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSaveCategory()}
              style={[styles.buttonBase, styles.saveButton]}
            >
              <Text style={styles.buttonText}>SAVE</Text>
            </Pressable>
          </View>
        </View>
      </ModalBase>
      <ColourPickerModal
        modalState={colourPickerModal}
        setModalState={setColourPickerModal}
        defaultColour={formData.colour}
        setColour={(colour: ColorValue) => {
          setFormData({ ...formData, colour });
        }}
      />
    </>
  );
};

export default UpdateCategoryModal;

const styles = StyleSheet.create({
  modalBody: {
    width: "85%",
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
  categoryInputContainer: {
    marginVertical: "auto",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  inputText: {
    flex: 1,
    color: "white",
    fontSize: 20,
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
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
});
