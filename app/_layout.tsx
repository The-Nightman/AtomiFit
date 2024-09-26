import { useContext, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Entypo, MaterialIcons, AntDesign } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import LottieSplashScreen from "@/components/Splash/LottieSplashScreen";
import { DrizzleProvider, DrizzleContext } from "@/contexts/drizzleContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const RootLayoutNav = () => {
  const { db } = useContext(DrizzleContext);
  const [animComplete, setAnimComplete] = useState<boolean>(false);
  // Preload fonts and vector icons from @expo/vector-icons here for a seamless user experience
  const [loaded, error]: [boolean, Error | null] = useFonts({
    ...Entypo.font,
    ...MaterialIcons.font,
    ...AntDesign.font,
  });

  // Prevent the splash screen from auto-hiding so we can manually control it while the app is loading
  SplashScreen.preventAutoHideAsync();

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
      <GestureHandlerRootView>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0F0F0F" },
          }}
        >
          <Stack.Screen name="index" options={{ gestureEnabled: true }} />
          <Stack.Screen name="(calendar)" options={{ gestureEnabled: true }} />
          <Stack.Screen name="exercisesSearch" options={{ gestureEnabled: true, presentation:"modal" }} />
          <Stack.Screen name="exercise/[exerciseId]" options={{ gestureEnabled: true }} />
        </Stack>
      </GestureHandlerRootView>
    </DrizzleProvider>
  );
};

export default RootLayoutNav;
