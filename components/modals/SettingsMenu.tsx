import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ModalBase from "./ModalBase";
import { useEffect, useState } from "react";
import { eventEmitter } from "@/utils/eventEmitter";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { router } from "expo-router";

/**
 * SettingsMenu component renders a modal with various settings options.
 *
 * This component listens for the `openSettings` event to toggle the visibility
 * of the settings menu. It uses a modal to display the settings options, which
 * include "Settings"(NYI), "Copy Workout"(NYI), "Share Workout"(NYI), "Analytics"(NYFI), and "Body Stats"(NYI).
 *
 * @returns {JSX.Element} The rendered SettingsMenu component.
 *
 * @component
 * @example
 * return (
 *   <SettingsMenu />
 * )
 */
const SettingsMenu = (): JSX.Element => {
  const [menuState, setMenuState] = useState<boolean>(false);

  // We use an event listener to show the options menu for an exercise, this saves us from
  // declaring a modal and state for each exercise item and there will be A LOT of these
  useEffect(() => {
    eventEmitter.on("openSettings", () => setMenuState(true));
    return () => {
      eventEmitter.off("openSettings", () => setMenuState(true));
    };
  }, []);

  return (
    <ModalBase
      modalState={menuState}
      setModalState={() => setMenuState(false)}
      backdropStyle={
        // We need to do this because of quirks on iOS impacting functionality, view ModalBase jsdocs for more info
        Platform.OS === "ios"
          ? { color: "#ffffff00", opacity: 1 }
          : { color: "", opacity: 0 }
      }
      animationProps={{
        animationIn: "fadeIn",
        animationOut: "fadeOut",
        animationInTiming: 300,
        animationOutTiming: 5,
      }}
    >
      <View style={styles.menuBody}>
        <Pressable
          style={styles.menuPressable}
          // Not yet implemented
          onPress={() => {}}
        >
          <Text style={styles.menuText}>Settings</Text>
        </Pressable>
        <Pressable
          style={styles.menuPressable}
          // Not yet implemented
          onPress={() => {}}
        >
          <Text style={styles.menuText}>Copy Workout</Text>
        </Pressable>
        <Pressable
          style={styles.menuPressable}
          // Not yet implemented
          onPress={() => {}}
        >
          <Text style={styles.menuText}>Share Workout</Text>
        </Pressable>
        <Pressable
          style={styles.menuPressable}
          // Not yet fully implemented
          onPress={() => {
            setMenuState(false);
            router.navigate({
              pathname: "/analytics/records",
            });
          }}
        >
          <Text style={styles.menuText}>Analytics</Text>
        </Pressable>
        <Pressable
          style={[styles.menuPressable, { borderBottomWidth: 0 }]}
          // Not yet implemented
          onPress={() => {}}
        >
          <Text style={styles.menuText}>Body Stats</Text>
        </Pressable>
      </View>
    </ModalBase>
  );
};

export default SettingsMenu;

const styles = StyleSheet.create({
  menuBody: {
    position: "absolute",
    top: "12%",
    right: -9,
    minWidth: "40%",
    borderRadius: 10,
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
  },
  menuPressable: {
    padding: 8,
    paddingRight: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#9F9F9F",
  },
  menuText: { color: "white", fontSize: 20 },
});
