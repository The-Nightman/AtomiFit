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

const APP_VERSION = version;

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
        <GestureHandlerRootView>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0F0F0F" },
            }}
          >
            <Stack.Screen name="index" options={{ gestureEnabled: true }} />
            <Stack.Screen name="welcome" options={{ gestureEnabled: true }} />
            <Stack.Screen
              name="(calendar)"
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen
              name="exercises"
              options={{ gestureEnabled: true, presentation: "modal" }}
            />
            <Stack.Screen
              name="exercise/[exerciseId]"
              options={{ gestureEnabled: true }}
            />
          </Stack>
        </GestureHandlerRootView>
      </SettingsProvider>
    </DrizzleProvider>
  );
};

export default RootLayoutNav;
