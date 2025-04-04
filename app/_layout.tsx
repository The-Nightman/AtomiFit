import { useContext, useEffect, useState } from "react";
import { router, Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  Entypo,
  MaterialIcons,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import LottieSplashScreen from "@/components/Splash/LottieSplashScreen";
import { DrizzleProvider, DrizzleContext } from "@/contexts/drizzleContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SettingsProvider } from "@/contexts/settingsContext";
import { version } from "../package.json";
import { Storage } from "expo-sqlite/kv-store";
import { StatusBar } from "expo-status-bar";
import NotesModal from "@/components/modals/NotesModal";
import { Platform, View } from "react-native";
import * as Notifications from "expo-notifications";
import { TimerProvider } from "@/contexts/timerContext";
import {
  createNotificationChannel,
  createNotificationCategories,
} from "@/utils/notifications/setupNotifications";

const APP_VERSION = version;

type NotificationDataFix = Notifications.NotificationContent &
  (
    | Notifications.NotificationContentIos
    | Notifications.NotificationContentAndroid
  ) & {
    dataString: DataString;
  };

interface DataString {
  shouldPlaySound: boolean;
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const notifContent = notification.request.content as NotificationDataFix;

    // The data object will always be present if passed on iOS
    if (Platform.OS === "ios") {
      return {
        shouldShowAlert: true,
        shouldPlaySound: notifContent.data?.shouldPlaySound ?? true,
        shouldSetBadge: true,
      };
    }

    // For some reason the data object in NotificationContent on android risks being swapped with a stringified
    // JSON object named dataString and this is neither included in the interface or the documentation.
    // Because of this we need to check for both and if neither are present we should set default behavior
    if (notifContent.data) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: notifContent.data.shouldPlaySound ?? true,
        shouldSetBadge: true,
      };
    }
    if (notifContent.dataString) {
      return {
        shouldShowAlert: true,
        shouldPlaySound:
          JSON.parse(notifContent.dataString as unknown as string)
            .shouldPlaySound ?? true,
        shouldSetBadge: true,
      };
    }

    // Edge case for when no data object is not passed in the request, we should mimic default behavior
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Notifications channels and categories should be set up outside of the
// component lifecycle to make sure we dont end up with duplicates
createNotificationChannel();
createNotificationCategories();

const RootLayoutNav = () => {
  const { db } = useContext(DrizzleContext);
  const [animComplete, setAnimComplete] = useState<boolean>(false);
  // Preload fonts and vector icons from @expo/vector-icons here for a seamless user experience
  const [loaded, error]: [boolean, Error | null] = useFonts({
    ...Entypo.font,
    ...MaterialIcons.font,
    ...AntDesign.font,
    ...MaterialCommunityIcons.font,
  });

  // Prevent the splash screen from auto-hiding so we can manually control it while the app is loading
  SplashScreen.preventAutoHideAsync();

  useEffect(() => {
    // For testing purposes we want to make sure we land on the welcome screen so we clear the stored version
    if (__DEV__) {
      Storage.removeItemSync("storedVersion");
    }

    const storedVersion = Storage.getItemSync("storedVersion");

    // If the stored version is not the same as the current version and the app is loaded we want to redirect to the welcome screen
    if (storedVersion !== APP_VERSION && animComplete && loaded && db) {
      Storage.setItemSync("storedVersion", APP_VERSION);
      router.replace("/welcome");
    }
  }, [animComplete, loaded, db]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // We want to hide the expo splash screen when the assets are loaded so we can play the
  // Lottie animation splash screen as a smooth transition from the static splash
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Make sure everything is loaded and the Lottie animation is complete before passing this cp
  if (!loaded || !animComplete || !db) {
    return <LottieSplashScreen setComplete={setAnimComplete} />;
  }

  return (
    <DrizzleProvider>
      <SettingsProvider>
        <TimerProvider>
          <GestureHandlerRootView>
            <StatusBar
              style="light" //We may want to change this to dark depending on the theme later
              translucent
            />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0F0F0F" },
              }}
            >
              <Stack.Screen name="index" options={{ gestureEnabled: true }} />
              <Stack.Screen name="welcome" options={{ gestureEnabled: true }} />
              <Stack.Screen
                name="timeline"
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen
                name="exercises"
                options={{
                  gestureEnabled: true,
                  gestureDirection: "vertical",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="exercise/[exerciseId]"
                options={{ gestureEnabled: true }}
              />
            </Stack>
            {/* 
            This does look misplaced and kind of hacky but the notes modal is used across the app,
            also it needs to be wrapped by a view or else it breaks the styling and is unuseable.
            regardless as long as the events are emitted correctly there wont be a problem
          */}
            <View>
              <NotesModal />
            </View>
          </GestureHandlerRootView>
        </TimerProvider>
      </SettingsProvider>
    </DrizzleProvider>
  );
};

export default RootLayoutNav;
