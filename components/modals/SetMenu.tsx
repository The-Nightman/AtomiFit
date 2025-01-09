import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ModalBase from "./ModalBase";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { useContext, useEffect, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";
import { eventEmitter } from "@/utils/eventEmitter";

/**
 * SetMenu component renders a modal with options to manage a set.
 *
 * This component uses Reanimated for animated styles and DrizzleContext for database operations.
 * It listens for `setMenu` events to display the menu at a specified position.
 * The menu includes a delete button with a press-and-hold action to delete the selected set from the database.
 *
 * @component
 * @returns {JSX.Element} The rendered SetMenu component.
 *
 * @example
 * ```tsx
 * <SetMenu />
 * ```
 */
const SetMenu = (): JSX.Element => {
  const [menuHeight, setMenuHeight] = useState(80);
  const [modalState, setModalState] = useState<{
    state: boolean;
    position: { x: number; y: number };
    setId: number | null;
  }>({
    state: false,
    position: { x: 0, y: 0 },
    setId: null,
  });
  const { height } = Dimensions.get("window");
  const { db } = useContext(DrizzleContext);

  const backgroundWidth = useSharedValue<number>(0);
  const animatedStyle = useAnimatedStyle(() => {
    // We use this so we can make the background color and width change to provide visual feedback to the user
    const backgroundColor = interpolateColor(
      backgroundWidth.value,
      [0, 1],
      ["#d10000", "#9b0000"]
    );

    return {
      width: `${backgroundWidth.value * 100}%`,
      backgroundColor,
    };
  });

  useEffect(() => {
    eventEmitter.on(
      "setMenu",
      (exerciseId: number, pos: { x: number; y: number; offset: number }) => {
        handleMenu(exerciseId, pos);
      }
    );
    return () => {
      eventEmitter.off(
        "setMenu",
        (exerciseId: number, pos: { x: number; y: number; offset: number }) => {
          handleMenu(exerciseId, pos);
        }
      );
    };
  }, []);

  /**
   * Handles the display of the menu by setting the modal state with the appropriate position.
   * If the menu would go off screen, it adjusts the position to open upwards instead.
   *
   * @param {number} setId - The ID of the set to be used in the modal state.
   * @param {{ x: number; y: number; offset: number }} pos - The position object containing x, y coordinates and an offset value.
   * @param {number} pos.x - The x-coordinate for the menu position.
   * @param {number} pos.y - The y-coordinate for the menu position.
   * @param {number} pos.offset - The offset value to adjust the menu position.
   */
  const handleMenu = (
    setId: number,
    pos: { x: number; y: number; offset: number }
  ): void => {
    setModalState({
      state: true,
      setId: setId,
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

  // Handle press in event for reanimated styles
  const handlePressIn = () => {
    backgroundWidth.value = withTiming(1, { duration: 1000 });
  };
  // Handle press out event for reanimated styles
  const handlePressOut = () => {
    backgroundWidth.value = withTiming(0);
  };

  /**
   * Deletes the currently selected set from the database and updates the state.
   *
   * This function deletes the set from the database using the current selected ID in the menu state.
   * It then resets the menu state and removes the set from the state.
   * If the selected set ID is null or undefined, the function returns early without performing any actions.
   *
   * @returns {Promise<void>} A promise that resolves when the set has been deleted and the state has been updated.
   */
  const deleteSet = async (): Promise<void> => {
    backgroundWidth.value = withTiming(0);

    if (!modalState.setId) return; // Return early if no set is selected
    await db
      .delete(schema.setsData)
      .where(eq(schema.setsData.id, modalState.setId));

    // Reset the menu state and selected id
    setModalState({
      ...modalState,
      state: false,
      setId: null,
    });
  };

  return (
    <ModalBase
      modalState={modalState.state}
      setModalState={() =>
        setModalState({
          ...modalState,
          state: false,
          setId: null,
        })
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
      <Pressable
        style={[
          styles.menuPressable,
          { top: modalState.position.y, right: modalState.position.x },
        ]}
        onLayout={(event) => setMenuHeight(event.nativeEvent.layout.height)}
        onPressIn={() => handlePressIn()}
        onPressOut={() => handlePressOut()}
        onLongPress={() => deleteSet()} // This is the actual event that triggers the delete
        delayLongPress={1000} //! This is important to take note of, any changes to the animation time of the background should match this value
        hitSlop={8}
      >
        {/* Animated View for background to give visual feedback */}
        <Animated.View style={[styles.animatedViewBaseStyle, animatedStyle]} />
        <View style={styles.menuInnerContainer}>
          <Text style={styles.menuDeleteText}>Delete Set (Hold)</Text>
          <MaterialCommunityIcons
            name="delete-forever-outline"
            size={24}
            color={"#CD2C2C"}
          />
        </View>
      </Pressable>
    </ModalBase>
  );
};

export default SetMenu;

const styles = StyleSheet.create({
  menuPressable: {
    position: "absolute",
    minHeight: 40,
    minWidth: "50%",
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
    borderRadius: 10,
    elevation: 15,
    overflow: "hidden",
    justifyContent: "center",
  },
  animatedViewBaseStyle: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
  },
  menuInnerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    gap: 16,
    alignItems: "center",
  },
  menuDeleteText: {
    color: "#CD2C2C",
    fontSize: 20,
    fontWeight: "600",
  },
});
