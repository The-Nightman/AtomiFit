import { isDevice } from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";

/**
 * Asynchronously creates android notification channels and requests notification permissions.
 *
 * This function handles notification setup for both Android and iOS platforms.
 * On Android, it creates notification channels with specified properties to ensure
 * notifications are properly configured. On both platforms, it checks for existing
 * notification permissions and prompts the user to grant permissions if not already granted.
 *
 * If the user denies the permission request, an alert is displayed to inform the user that
 * the app requires notification permissions for certain features and provides an option to
 * open the app settings to enable them or to dismiss the alert and proceed.
 *
 * @returns {Promise<void>} A promise that resolves when the notification channels are
 * created and permissions status is established.
 */
export const createNotificationChannel = async (): Promise<void> => {
  let isPermissionGranted: Notifications.PermissionStatus;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("atomifitTimerChannel", {
      name: "Rest Timer Notifications",
      description: "Silent notifications for the rest timer",
      importance: Notifications.AndroidImportance.LOW,
      lightColor: "#FF231F7C",
    });

    //* Declare more channels here when needed
  }

  if (isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    isPermissionGranted = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      isPermissionGranted = status;
    }

    // We don't want to show the alert if the user has already denied or granted permissions
    // We will definitely fail apple and google review if we show the alert if perms are denied
    if (isPermissionGranted !== "granted" && isPermissionGranted !== "denied") {
      Alert.alert(
        "Are You Sure?",
        `AtomiFit needs notifications permissions for the following features: \n${
          Platform.OS === "android" ? "\n- Status Bar Rest Timer" : ""
        }
      \n\nYou can enable these at any time in your app settings.`,
        [
          {
            text: "Not Now",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
            style: "default",
          },
        ],
        {
          cancelable: true,
        }
      );
    }
  }
};

/**
 * Asynchronously creates the notification categories for the application.
 *
 * This function handles notification category configuration for the app.
 * Categories are defined with an identifier and an array of actions each 
 * with their own identifier, button title, and options.
 * 
 * Currently defined categories are:
 * - "timer": This category includes a single descructive action to cancel the timer.
 *
 * @returns {Promise<void>} A promise that resolves when the notification categories are successfully set up.
 */
export const createNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync("timer", [
    {
      identifier: "cancel",
      buttonTitle: "Cancel Timer",
      options: {
        isDestructive: true,
      },
    },
  ]);
};
