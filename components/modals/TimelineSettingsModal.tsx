import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ModalBase from "./ModalBase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { eventEmitter } from "@/utils/eventEmitter";
import { usePathname } from "expo-router";
import { Storage } from "expo-sqlite/kv-store";

interface TimelinePreferences {
  timelineCategoryMarkers: boolean;
  displaySets: boolean;
}

interface TimelineSettingsModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  timelinePreferencesState: TimelinePreferences;
  setTimelinePreferencesState: React.Dispatch<
    React.SetStateAction<TimelinePreferences>
  >;
}

/**
 * TimelineSettingsModal component renders a modal for managing timeline view settings and preferences.
 *
 * This component uses a state managed by the parent and displays options for toggling various timeline-related
 * preferences such as enabling or disabling category markers. It persists the user's preferences using
 * `expo-sqlite/kv-store` and emits events to notify other screens about changes made.
 *
 * @component
 * @param {TimelineSettingsModalProps} props - The props for the modal component.
 * @param {boolean} props.visible - Controls the visibility of the modal.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setVisible - A function to update the modal's visibility state.
 * @param {TimelinePreferences} props.timelinePreferencesState - The current state of the timeline preferences.
 * @param {React.Dispatch<React.SetStateAction<TimelinePreferences>>} props.setTimelinePreferencesState - A function to update the timeline preferences state.
 *
 * @returns {JSX.Element} The rendered modal component.
 * @example
 * ```tsx
 * const [visible, setVisible] = useState(false);
 * const [timelinePreferences, setTimelinePreferences] = useState<TimelinePreferences>({
 *   timelineCategoryMarkers: true,
 * });
 *
 * return (
 *   <TimelineSettingsModal
 *     visible={visible}
 *     setVisible={setVisible}
 *     timelinePreferencesState={timelinePreferences}
 *     setTimelinePreferencesState={setTimelinePreferences}
 *   />
 * );
 * ```
 */
const TimelineSettingsModal = ({
  visible,
  setVisible,
  timelinePreferencesState,
  setTimelinePreferencesState,
}: TimelineSettingsModalProps): JSX.Element => {
  const [, path] = usePathname().match(/^\/timeline\/(\w+)/)!; // We will use this to render specific options for the calendar and list view screens

  /**
   * Toggles the user's preference for a given timeline option in state
   * and updates the Storage key appropriately.
   *
   * @remarks This is only intended to be used with options that are directly
   * intended to persist for the calendar and list view screens.
   *
   * @param {keyof TimelinePreferences} preference - The key of the timeline option to toggle.
   * @returns {Promise<void>} A promise that resolves when the preference has been saved to storage.
   */
  const handlePreferenceToggle = async (
    preference: keyof TimelinePreferences
  ): Promise<void> => {
    await Storage.setItem(
      preference,
      (!timelinePreferencesState[preference]).toString()
    );

    setTimelinePreferencesState((prev) => ({
      ...prev,
      [preference]: !prev[preference],
    }));

    eventEmitter.emit("timelinePreferenceChange"); // We emit this event to notify the screens that the preferences have changed and simplify the process
  };

  return (
    <ModalBase
      modalState={visible}
      setModalState={setVisible}
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
        {path === "listView" && (
          <Pressable
            style={styles.menuPressableCheckbox}
            onPress={() => handlePreferenceToggle("displaySets")}
          >
            <Text style={styles.menuText}>Display Sets</Text>
            {timelinePreferencesState.displaySets ? (
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
        )}
        <Pressable
          style={[styles.menuPressableCheckbox, { borderBottomWidth: 0 }]}
          onPress={() => handlePreferenceToggle("timelineCategoryMarkers")}
        >
          <Text style={styles.menuText}>Category Dots</Text>
          {timelinePreferencesState.timelineCategoryMarkers ? (
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
    </ModalBase>
  );
};

export default TimelineSettingsModal;

const styles = StyleSheet.create({
  menuBody: {
    position: "absolute",
    top: "12%",
    right: -9,
    minWidth: "40%",
    borderRadius: 10,
    backgroundColor: hexcodeLuminosity("#3F3C3C", 20),
  },
  menuPressableCheckbox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#9F9F9F",
  },
  menuText: { color: "white", fontSize: 20 },
});
