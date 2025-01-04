import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ModalBase from "./ModalBase";
import { useContext, useEffect, useState } from "react";
import { eventEmitter } from "@/utils/eventEmitter";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { router } from "expo-router";
import { eq } from "drizzle-orm";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * ExerciseMenu component displays a modal with options to edit or delete an exercise.
 *
 * The component listens for an `exerciseMenu` event to display the menu at the specified position.
 * It adjusts the menu position to ensure it does not go off-screen.
 *
 * @remarks The `exerciseMenu` event should emitted with the exerciseId of type number and
 * pos object with x y and offset properties of type number.
 *
 * @component
 * @returns {JSX.Element} The ExerciseMenu component.
 *
 * @example
 * ```tsx
 * <ExerciseMenu />
 * ```
 */
const ExerciseMenu = (): JSX.Element => {
  const insets = useSafeAreaInsets();
  const [modalState, setModalState] = useState<{
    state: boolean;
    exerciseId: number | null;
    position: { x: number; y: number };
  }>({ state: false, exerciseId: null, position: { x: 0, y: 0 } });
  const [menuHeight, setMenuHeight] = useState(80 + insets.bottom);
  const { height } = Dimensions.get("window");
  const { db } = useContext(DrizzleContext);

  // We use an event listener to show the options menu for an exercise, this saves us from
  // declaring a modal and state for each exercise item and there will be A LOT of these
  useEffect(() => {
    eventEmitter.on(
      "exerciseMenu",
      (exerciseId: number, pos: { x: number; y: number; offset: number }) => {
        handleMenu(exerciseId, pos);
      }
    );
    return () => {
      eventEmitter.off(
        "exerciseMenu",
        (exerciseId: number, pos: { x: number; y: number; offset: number }) => {
          handleMenu(exerciseId, pos);
        }
      );
    };
  }, [menuHeight]);

  /**
   * Handles the display of the exercise menu by setting the modal state.
   *
   * The function calculates the y-coordinate to ensure the menu does not go off-screen.
   * If the menu would go off-screen, it opens upwards instead.
   *
   * @param {number} exerciseId - The ID of the exercise to be displayed in the menu.
   * @param {{ x: number; y: number; offset: number }} pos - The position object containing x, y coordinates and an offset value.
   * @param {number} pos.x - The x-coordinate for the menu position.
   * @param {number} pos.y - The y-coordinate for the menu position.
   * @param {number} pos.offset - The offset value to adjust the menu position.
   * @returns {void}
   */
  const handleMenu = (
    exerciseId: number,
    pos: { x: number; y: number; offset: number }
  ): void => {
    setModalState({
      state: true,
      exerciseId: exerciseId,
      position: {
        x: pos.x,
        // We do this so that if the menu would go off screen it will instead open upwards
        y:
          pos.y + pos.offset + menuHeight > height
            ? pos.y - (menuHeight + pos.offset)
            : pos.y + pos.offset,
      },
    });
  };

  return (
    <ModalBase
      modalState={modalState.state}
      setModalState={() =>
        setModalState({ ...modalState, state: false, exerciseId: null })
      }
      backdropStyle={
        // We need to do this because of quirks on iOS impacting functionality, view ModalBase jsdocs for more info
        Platform.OS === "ios"
          ? { color: "#ffffff00", opacity: 1 }
          : { color: "", opacity: 0 }
      }
      animationProps={{
        animationIn: "slideInRight",
        animationOut: "slideOutRight",
        animationInTiming: 300,
        animationOutTiming: 300,
      }}
    >
      <View
        style={[
          styles.menuBody,
          {
            position: "absolute",
            top: modalState.position.y,
            right: modalState.position.x,
          },
        ]}
        onLayout={(event) => {
          setMenuHeight(event.nativeEvent.layout.height + insets.bottom);
        }}
      >
        <Pressable
          style={styles.menuPressable}
          onPress={() => {
            if (modalState.exerciseId)
              router.navigate({
                pathname: "/exercises/edit/exercise/[exerciseId]",
                params: { exerciseId: modalState.exerciseId },
              });
            setModalState({ ...modalState, state: false, exerciseId: null });
          }}
        >
          <Text style={styles.menuText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.menuPressable, { borderBottomWidth: 0 }]}
          onPress={async () => {
            if (modalState.exerciseId)
              await db
                .delete(schema.exercises)
                .where(eq(schema.exercises.id, modalState.exerciseId));
            setModalState({ ...modalState, state: false, exerciseId: null });
          }}
        >
          <Text style={styles.menuText}>Delete</Text>
        </Pressable>
      </View>
    </ModalBase>
  );
};

export default ExerciseMenu;

const styles = StyleSheet.create({
  menuBody: {
    borderRadius: 10,
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
    minWidth: "40%",
  },
  menuPressable: {
    padding: 8,
    paddingRight: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#9F9F9F",
  },
  menuText: { color: "white", fontSize: 20 },
});
