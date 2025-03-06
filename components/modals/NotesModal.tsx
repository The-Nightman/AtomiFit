import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ModalBase from "./ModalBase";
import { useContext, useEffect, useState } from "react";
import { eventEmitter } from "@/utils/eventEmitter";
import { TextInput } from "react-native-gesture-handler";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * NotesModal component renders a modal for adding and editing notes.
 * It listens for the `notesModal` event to display the modal with the provided set ID and notes passed as params.
 * The modal allows users to input notes and save them to the database.
 * If an error occurs during the save operation, an error message is displayed.
 *
 * @component
 * @returns {JSX.Element} The rendered NotesModal component.
 *
 * @example
 * ```
 * <NotesModal />
 * ```
 */
const NotesModal = (): JSX.Element => {
  const [modalState, setModalState] = useState<{
    state: boolean;
    setId: number | null;
    notes: string;
    error: boolean;
  }>({
    state: false,
    setId: null,
    notes: "",
    error: false,
  });
  const { db } = useContext(DrizzleContext);

  // We use an event listener to show the notes modal just as we did with our other
  // menu modals, this allows us to seperate concerns and improve performance by
  // minimizing the number of modals and states declared in any single render
  useEffect(() => {
    eventEmitter.on("notesModal", (setId: number, notes: string) => {
      setModalState({ state: true, setId: setId, notes: notes, error: false });
    });
    return () => {
      eventEmitter.off("notesModal", (setId: number, notes: string) => {
        setModalState({
          state: true,
          setId: setId,
          notes: notes,
          error: false,
        });
      });
    };
  }, []);

  /**
   * Saves the notes for a specific set identified by `modalState.setId`.
   * On successful update, it resets the modal state.
   * If an error occurs during the update, it sets the error state to true.
   *
   * @returns {Promise<void>} A promise that resolves when the notes are saved.
   */
  const saveNotes = async (): Promise<void> => {
    if (modalState.setId !== null) {
      try {
        await db
          .update(schema.setsData)
          .set({ notes: modalState.notes })
          .where(eq(schema.setsData.id, modalState.setId));
        setModalState({ state: false, setId: null, notes: "", error: false });
      } catch (error) {
        setModalState({ ...modalState, error: true });
      }
    }
  };

  return (
    <ModalBase
      modalState={modalState.state}
      setModalState={() =>
        setModalState({ state: false, setId: null, notes: "", error: false })
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalBody}>
          <View style={styles.titleErrContainer}>
            <Text style={styles.modalTitle}>NOTES</Text>
            {modalState.error && (
              <Text style={styles.errorText}>
                There was an error saving your notes
              </Text>
            )}
          </View>
          <TextInput
            style={styles.notesInput}
            value={modalState.notes}
            onChange={(e) =>
              setModalState({ ...modalState, notes: e.nativeEvent.text })
            }
            placeholder={"Enter notes here..."}
            placeholderTextColor={"white"}
            multiline
          />
          <View style={styles.modalButtonContainer}>
            <Pressable
              onPress={() => {
                setModalState({
                  state: false,
                  setId: null,
                  notes: "",
                  error: false,
                });
              }}
              style={[styles.buttonBase, styles.cancelButton]}
            >
              <Text style={styles.buttonText}>CANCEL</Text>
            </Pressable>
            <Pressable
              style={[styles.buttonBase, styles.saveButton]}
              onPress={() => {
                saveNotes();
              }}
            >
              <Text style={styles.buttonText}>SAVE</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ModalBase>
  );
};

export default NotesModal;

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    width: "90%",
    minHeight: "30%",
    maxHeight: "95%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-evenly",
    padding: 20,
    gap: 16,
  },
  titleErrContainer: { alignSelf: "flex-start" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  errorText: {
    fontSize: 17,
    color: "red",
  },
  notesInput: {
    width: "95%",
    minHeight: 44,
    maxHeight: "70%",
    color: "white",
    fontSize: 17,
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 16,
  },
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
