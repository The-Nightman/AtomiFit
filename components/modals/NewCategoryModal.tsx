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
import { randomHexcode } from "@/utils/randomHexcode";
import Toast from "../ux/Toast";
import * as schema from "@/database/schema";
import { DrizzleContext } from "@/contexts/drizzleContext";

interface NewCategoryModalProps {
  modalState: boolean;
  setModalState: React.Dispatch<React.SetStateAction<boolean>>;
  returnCategoryId: (id: number) => void;
}

/**
 * NewCategoryModal component.
 *
 * This component renders a modal for creating a new category. It includes a form
 * with inputs for the category name and colour, and handles saving the new category
 * to the database. The component also displays toast messages for success or error
 * notifications.
 *
 * @component
 * @param {NewCategoryModalProps} props - The component props.
 * @param {boolean} props.modalState - The state of the modal (open/closed).
 * @param {Function} props.setModalState - Function to set the state of the modal.
 * @param {Function} props.returnCategoryId - Function to return the ID of the newly created category.
 * @returns {JSX.Element} The rendered NewCategoryModal component.
 */
const NewCategoryModal = ({
  modalState,
  setModalState,
  returnCategoryId,
}: NewCategoryModalProps): JSX.Element => {
  const [formData, setFormData] = useState<{
    name: string;
    colour: ColorValue;
  }>({
    name: "",
    colour: "",
  });
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
    if (modalState) setFormData({ name: "", colour: randomHexcode() }); // We don't want unnecessary state changes when closing the modal
  }, [modalState]); // We don't need to but we can set this just for the user, let them have some fun generating random colours

  /**
   * Handles the saving of a new category.
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
      const category: { id: number }[] = await db
        .insert(schema.categories)
        .values({
          name: formData.name,
          colour: formData.colour as string, // We know it's actually a string primitive so its safe to cast
        })
        .returning({ id: schema.categories.id });

      setToastState({
        show: true,
        colour: "#388E3C",
        message: "Category saved successfully",
      });
      returnCategoryId(category[0].id); // We return the id to the parent so it will automatically be selected
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
          <Text style={styles.modalTitle}>NEW CATEGORY</Text>
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.nativeEvent.text })
              }
            />
          </View>
          <View style={styles.modalButtonContainer}>
            <Pressable
              onPress={() => {
                setFormData({ name: "", colour: "#60DD49" });
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
        setColour={(colour: ColorValue) => setFormData({ ...formData, colour })}
      />
    </>
  );
};

export default NewCategoryModal;

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
